import { db } from "./firebase.js";
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const contadorElem = document.getElementById("contador");
const multElem = document.getElementById("multiplicador");
const grade = document.getElementById("grade-historico");

const minutosValidos = [
  1,4,7,9,11,14,17,19,21,24,27,29,
  31,34,37,39,41,44,47,49,51,54,57,59
];

/* Multiplicador determinístico */
function gerarMultiplicadorDeterministico(hora, minuto){
  const data = new Date();
  const chave = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}-${hora}-${minuto}`;
  let seed = 0;
  for(let i=0;i<chave.length;i++){
    seed = (seed*31 + chave.charCodeAt(i)) % 1000000;
  }
  const chance = seed % 100;
  if(chance < 70) return ((seed % 180) / 100 + 1.8).toFixed(2);
  if(chance < 95) return ((seed % 650) / 100 + 3.5).toFixed(2);
  return ((seed % 9000) / 100 + 10).toFixed(2);
}

/* Adicionar bloco visual */
function adicionarBloco(hora, minuto, mult){
  const bloco = document.createElement("div");
  bloco.classList.add("bloco");

  const valor = document.createElement("span");
  valor.classList.add("valor");
  valor.innerText = mult + "x";

  const horaTxt = document.createElement("span");
  horaTxt.classList.add("hora");
  horaTxt.innerText = `${hora.toString().padStart(2,"0")}:${minuto.toString().padStart(2,"0")}`;

  if(mult < 3.5) bloco.classList.add("baixo");
  else if(mult < 10) bloco.classList.add("medio");
  else bloco.classList.add("alto");

  bloco.appendChild(valor);
  bloco.appendChild(horaTxt);

  grade.prepend(bloco);
  if(grade.children.length > 30){
    grade.removeChild(grade.lastChild);
  }
}

/* Atualizar contador */
function atualizarContador(){
  const agora = new Date();
  const minutoAtual = agora.getMinutes();
  const horaAtual = agora.getHours();

  let proxMinuto = minutosValidos.find(m => m > minutoAtual);
  let proxHora = horaAtual;
  if(proxMinuto === undefined){
    proxMinuto = minutosValidos[0];
    proxHora = (horaAtual+1)%24;
  }

  const alvo = new Date();
  alvo.setHours(proxHora, proxMinuto, 0, 0);

  const diff = Math.floor((alvo - agora)/1000);
  const min = String(Math.floor(diff/60)).padStart(2,"0");
  const seg = String(diff%60).padStart(2,"0");
  contadorElem.innerText = `Próxima entrada em: ${min}:${seg}`;
}

/* Salvar sinal no Firestore */
async function salvarSinal(hora, minuto, mult){
  try {
    await addDoc(collection(db, "sinais"), {
      hora, minuto, multiplicador: mult,
      criadoEm: serverTimestamp()
    });
    console.log("✅ Sinal salvo:", hora, minuto, mult);
  } catch(e){
    console.error("Erro ao salvar:", e);
  }
}

/* Gerar e salvar automaticamente (executar apenas em 1 instância) */
setInterval(() => {
  const agora = new Date();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();
  atualizarContador();

  if(minutosValidos.includes(minuto)){
    const mult = gerarMultiplicadorDeterministico(hora, minuto);
    multElem.innerText = mult + "x";
    if(mult >= 10) multElem.style.color = "#ff0000";
    else if(mult >= 5) multElem.style.color = "#00ff00";
    else multElem.style.color = "#ff4da6";

    // salvar no Firestore
    salvarSinal(hora, minuto, mult);
  }
}, 1000);

/* Escutar sinais do Firestore em tempo real */
const q = query(
  collection(db, "sinais"),
  orderBy("criadoEm", "desc"),
  limit(30)
);

onSnapshot(q, (snapshot) => {
  grade.innerHTML = "";
  snapshot.forEach(doc => {
    const d = doc.data();
    adicionarBloco(d.hora, d.minuto, d.multiplicador);
  });
});