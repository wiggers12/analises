/* ==============================
   IMPORTS FIREBASE
============================== */
import { auth, db } from "./firebase.js";
import { 
  collection, addDoc, query, orderBy, limit, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ==============================
   CALLS / TIMER / HISTÓRICO
============================== */
const contadorElem = document.getElementById("contador");
const multElem = document.getElementById("multiplicador");
const listaHistorico = document.getElementById("lista-historico");

const minutosValidos = [
  1,4,7,9,11,14,17,19,21,24,27,29,
  31,34,37,39,41,44,47,49,51,54,57,59
];

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
setInterval(atualizarContador, 1000);

/* Adicionar item ao histórico */
function adicionarBloco(hora, minuto, mult){
  const li = document.createElement("li");
  li.innerText = `${hora.toString().padStart(2,"0")}:${minuto.toString().padStart(2,"0")} → ${mult}x`;

  if(mult < 2) li.classList.add("baixo");
  else if(mult < 10) li.classList.add("medio");
  else li.classList.add("alto");

  listaHistorico.prepend(li);
  if(listaHistorico.children.length > 30){
    listaHistorico.removeChild(listaHistorico.lastChild);
  }
}

/* Escutar sinais do ADMIN em tempo real */
const q = query(
  collection(db, "sinais"),
  orderBy("criadoEm", "desc"),
  limit(30)
);

onSnapshot(q, (snapshot) => {
  listaHistorico.innerHTML = "";
  let primeiro = true;
  snapshot.forEach(doc => {
    const d = doc.data();
    adicionarBloco(d.hora, d.minuto, d.multiplicador);

    // exibir o último multiplicador no card principal
    if(primeiro){
      multElem.innerText = d.multiplicador + "x";
      if(d.multiplicador >= 10) multElem.style.color = "#ff0000";
      else if(d.multiplicador >= 5) multElem.style.color = "#00ff00";
      else multElem.style.color = "#ff4da6";
      primeiro = false;
    }
  });
});

/* ==============================
   GERENCIAMENTO FINANCEIRO
============================== */
const resumoInvestido = document.getElementById("resumoInvestido");
const resumoGanhos = document.getElementById("resumoGanhos");
const resumoPerdas = document.getElementById("resumoPerdas");
const resumoLucro = document.getElementById("resumoLucro");
const tabelaEntradas = document.getElementById("tabelaEntradas");
const dicasBox = document.getElementById("dicasGerenciamento");

const inputValor = document.getElementById("valorEntrada");
const selectTipo = document.getElementById("tipoEntrada");

/* Escutar dados do usuário logado */
auth.onAuthStateChanged(user => {
  if (!user) return;

  const ref = collection(db, "usuarios", user.uid, "gerenciamento");
  const q = query(ref, orderBy("data","desc"));

  onSnapshot(q, (snap) => {
    let investido = 0, ganhos = 0, perdas = 0;
    let html = "";

    snap.forEach(docSnap => {
      const d = docSnap.data();
      if (d.tipo === "aposta") investido += d.valor;
      if (d.tipo === "ganho") ganhos += d.valor;
      if (d.tipo === "perda") perdas += d.valor;

      html += `
        <tr>
          <td data-label="Data">${d.data.toDate().toLocaleDateString("pt-BR")}</td>
          <td data-label="Tipo">${d.tipo}</td>
          <td data-label="Valor">R$ ${d.valor.toFixed(2)}</td>
        </tr>`;
    });

    tabelaEntradas.innerHTML = html;

    resumoInvestido.innerText = "R$ " + investido.toFixed(2);
    resumoGanhos.innerText = "R$ " + ganhos.toFixed(2);
    resumoPerdas.innerText = "R$ " + perdas.toFixed(2);
    resumoLucro.innerText = "R$ " + (ganhos - perdas).toFixed(2);

    gerarDicas(investido, ganhos, perdas);
  });
});

/* Adicionar entrada manual */
window.adicionarEntrada = async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("⚠️ Faça login para usar o gerenciamento!");
    return;
  }

  const tipo = selectTipo.value;
  const valor = parseFloat(inputValor.value);

  if (!valor || valor <= 0) {
    alert("Digite um valor válido!");
    return;
  }

  await addDoc(collection(db, "usuarios", user.uid, "gerenciamento"), {
    tipo,
    valor,
    data: new Date()
  });

  inputValor.value = "";
  selectTipo.value = "aposta";
};

/* Dicas inteligentes */
function gerarDicas(investido, ganhos, perdas){
  let dicas = [];
  const lucro = ganhos - perdas;

  if (investido === 0) {
    dicas.push("⚡ Comece registrando suas apostas para ter controle.");
  } else {
    const taxaRetorno = (ganhos / investido * 100).toFixed(1);
    dicas.push(`📊 Sua taxa de retorno é de ${isNaN(taxaRetorno)?0:taxaRetorno}%`);

    if (lucro > 0) {
      dicas.push("✅ Você está lucrando! Considere aumentar suas apostas gradualmente.");
    } else if (lucro < 0) {
      dicas.push("⚠️ Está em prejuízo. Reduza o valor das próximas apostas para proteger a banca.");
    }

    const sugestao = Math.max(1, (investido * 0.05).toFixed(2));
    dicas.push(`🎯 Sugestão: aposte até R$ ${sugestao} na próxima rodada.`);
  }

  dicasBox.innerHTML = dicas.map(d => `<p>${d}</p>`).join("");
}