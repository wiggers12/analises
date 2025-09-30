/* ==============================
   IMPORTS FIREBASE
============================== */
import { auth, db } from "./firebase.js";
import { 
  collection, addDoc, query, orderBy, limit, onSnapshot, doc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ==============================
   CALLS / TIMER / HISTÓRICO
============================== */
const contadorElem = document.getElementById("contador");
const multElem = document.getElementById("multiplicador");
const listaHistorico = document.getElementById("lista-historico");

const minutosValidos = [1,4,7,9,11,14,17,19,21,24,27,29,31,34,37,39,41,44,47,49,51,54,57,59];

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

/* Adicionar item ao histórico de calls */
function adicionarBloco(hora, minuto, mult){
  const li = document.createElement("li");
  li.innerText = `${hora.toString().padStart(2,"0")}:${minuto.toString().padStart(2,"0")} → ${mult}x`;

  if(mult < 2) li.classList.add("baixo");     // azul
  else if(mult < 10) li.classList.add("medio"); // roxo
  else li.classList.add("alto");               // rosa

  listaHistorico.prepend(li);
  if(listaHistorico.children.length > 30){
    listaHistorico.removeChild(listaHistorico.lastChild);
  }
}

/* Escutar sinais do ADMIN em tempo real */
const q = query(collection(db, "sinais"), orderBy("criadoEm", "desc"), limit(30));

onSnapshot(q, (snapshot) => {
  listaHistorico.innerHTML = "";
  let primeiro = true;
  snapshot.forEach(doc => {
    const d = doc.data();
    adicionarBloco(d.hora, d.minuto, d.multiplicador);

    if(primeiro){
      multElem.innerText = d.multiplicador + "x";
      if(d.multiplicador >= 10) multElem.style.color = "#ff4da6"; // rosa
      else if(d.multiplicador >= 2) multElem.style.color = "#a29bfe"; // roxo
      else multElem.style.color = "#3498db"; // azul
      primeiro = false;
    }
  });
});

/* ==============================
   GERENCIAMENTO FINANCEIRO (RESUMO)
============================== */
import { 
  doc, setDoc, updateDoc, onSnapshot, increment 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const resumoSaldo = document.getElementById("resumoSaldo");
const resumoInvestido = document.getElementById("resumoInvestido");
const resumoGanhos = document.getElementById("resumoGanhos");
const resumoPerdas = document.getElementById("resumoPerdas");
const resumoLucro = document.getElementById("resumoLucro");
const dicasBox = document.getElementById("dicasGerenciamento");

const inputValor = document.getElementById("valorEntrada");
const selectTipo = document.getElementById("tipoEntrada");

/* Escutar o usuário logado */
auth.onAuthStateChanged(async user => {
  if (!user) {
    alert("⚠️ Faça login para acessar o app!");
    return;
  }

  // referência do resumo único
  const resumoRef = doc(db, "usuarios", user.uid, "gerenciamento", "resumo");

  // inicializa caso não exista
  await setDoc(resumoRef, {
    investido: 0,
    ganhos: 0,
    perdas: 0,
    lucro: 0,
    saldo: 0
  }, { merge: true });

  // escuta em tempo real o resumo
  onSnapshot(resumoRef, (docSnap) => {
    if (docSnap.exists()) {
      const d = docSnap.data();

      resumoInvestido.innerText = "R$ " + d.investido.toFixed(2);
      resumoGanhos.innerText    = "R$ " + d.ganhos.toFixed(2);
      resumoPerdas.innerText    = "R$ " + d.perdas.toFixed(2);
      resumoLucro.innerText     = "R$ " + d.lucro.toFixed(2);
      resumoSaldo.innerText     = "R$ " + d.saldo.toFixed(2);

      gerarDicas(d.investido, d.ganhos, d.perdas);
    }
  });
});

/* Adicionar entrada manual */
window.adicionarEntrada = async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("⚠️ Faça login para usar o gerenciamento!");
    return;
  }

  const resumoRef = doc(db, "usuarios", user.uid, "gerenciamento", "resumo");
  const tipo = selectTipo.value;
  const valor = parseFloat(inputValor.value);

  if (!valor || valor <= 0) {
    alert("Digite um valor válido!");
    return;
  }

  if (tipo === "investido") {
    await updateDoc(resumoRef, {
      investido: increment(valor),
      saldo: increment(valor)
    });
  }

  if (tipo === "ganho") {
    await updateDoc(resumoRef, {
      ganhos: increment(valor),
      lucro: increment(valor),
      saldo: increment(valor)
    });
  }

  if (tipo === "perda") {
    await updateDoc(resumoRef, {
      perdas: increment(valor),
      lucro: increment(-valor),
      saldo: increment(-valor)
    });
  }

  inputValor.value = "";
  selectTipo.value = "investido"; // reseta para investimento
};

/* Dicas inteligentes */
function gerarDicas(investido, ganhos, perdas) {
  let dicas = [];
  const lucro = ganhos - perdas;

  if (investido === 0) {
    dicas.push("⚡ Comece registrando seu primeiro investimento.");
  } else {
    const taxaRetorno = (ganhos / investido * 100).toFixed(1);
    dicas.push(`📊 Sua taxa de retorno é de ${isNaN(taxaRetorno)?0:taxaRetorno}%`);

    if (lucro > 0) {
      dicas.push("✅ Você está lucrando! Continue com disciplina.");
    } else if (lucro < 0) {
      dicas.push("⚠️ Está em prejuízo. Reduza o risco até se recuperar.");
    } else {
      dicas.push("ℹ️ Você está no zero a zero, mantenha a estratégia.");
    }

    const sugestao = Math.max(1, (investido * 0.05).toFixed(2));
    dicas.push(`🎯 Sugestão: aposte até R$ ${sugestao} na próxima rodada.`);
  }

  dicasBox.innerHTML = dicas.map(d => `<p>${d}</p>`).join("");
}

/* ==============================
   HISTÓRICO PREMIUM (RESULTADOS REAIS)
============================== */
const gradeHistoricoPremium = document.getElementById("grade-historico-premium");

if (gradeHistoricoPremium) {
  const qHist = query(collection(db, "historico"), orderBy("criadoEm", "desc"), limit(50));

  onSnapshot(qHist, (snap) => {
    gradeHistoricoPremium.innerHTML = "";
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const card = document.createElement("div");
      card.classList.add("card-historico");

      let cor = "#3498db"; // azul padrão
      if (d.multiplicador >= 10) cor = "#ff4da6"; // rosa
      else if (d.multiplicador >= 2) cor = "#a29bfe"; // roxo

      card.style.border = `2px solid ${cor}`;
      card.style.padding = "10px";
      card.style.margin = "5px";
      card.style.borderRadius = "6px";

      card.innerHTML = `
        <p><strong>${d.hora.toString().padStart(2,"0")}:${d.minuto.toString().padStart(2,"0")}</strong></p>
        <p style="color:${cor};font-weight:bold;">${d.multiplicador}x</p>
      `;

      gradeHistoricoPremium.appendChild(card);
    });
  });
}