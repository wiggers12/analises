import { auth, db } from "./firebase.js";
import { 
  collection, addDoc, onSnapshot, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==============================
// ELEMENTOS DA TELA
// ==============================
const resumoInvestido = document.getElementById("resumoInvestido");
const resumoGanhos = document.getElementById("resumoGanhos");
const resumoPerdas = document.getElementById("resumoPerdas");
const resumoLucro = document.getElementById("resumoLucro");
const tabelaEntradas = document.getElementById("tabelaEntradas");
const dicasBox = document.getElementById("dicasGerenciamento");

// inputs do formulário
const inputValor = document.getElementById("valorEntrada");
const selectTipo = document.getElementById("tipoEntrada");
const btnAdicionar = document.getElementById("btnAdicionarEntrada");

// ==============================
// ESCUTAR AUTENTICAÇÃO
// ==============================
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

    // atualizar resumo
    resumoInvestido.innerText = "R$ " + investido.toFixed(2);
    resumoGanhos.innerText = "R$ " + ganhos.toFixed(2);
    resumoPerdas.innerText = "R$ " + perdas.toFixed(2);
    resumoLucro.innerText = "R$ " + (ganhos - perdas).toFixed(2);

    // atualizar dicas inteligentes
    gerarDicas(investido, ganhos, perdas);
  });
});

// ==============================
// FUNÇÃO: adicionar entrada
// ==============================
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

// ==============================
// FUNÇÃO: gerar dicas inteligentes
// ==============================
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

    // sugestão de aposta baseada no saldo
    const sugestao = Math.max(1, (investido * 0.05).toFixed(2));
    dicas.push(`🎯 Sugestão: aposte até R$ ${sugestao} na próxima rodada.`);
  }

  dicasBox.innerHTML = dicas.map(d => `<p>${d}</p>`).join("");
}