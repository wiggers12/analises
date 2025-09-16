import { auth, db } from "./firebase.js";
import { 
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Apenas admin autorizado
const adminEmail = "dionegalato1212@gmail.com";

// Verifica login do admin
onAuthStateChanged(auth, (user) => {
  if (user && user.email === adminEmail) {
    carregarAssinaturas();
  } else {
    alert("Acesso negado. Apenas admin autorizado.");
    window.location.href = "login.html";
  }
});

// Carregar assinaturas na tabela
async function carregarAssinaturas() {
  const assinaturasRef = collection(db, "assinaturas");
  const snapshot = await getDocs(assinaturasRef);
  const table = document.getElementById("assinaturasTable");
  table.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const validade = data.validade?.toDate ? data.validade.toDate().toLocaleDateString() : "Não definido";

    const row = `
      <tr>
        <td>${data.email}</td>
        <td>${data.status}</td>
        <td>${validade}</td>
        <td>
          <button onclick="atualizarStatus('${docSnap.id}', 'ATIVO')">Ativar</button>
          <button onclick="atualizarStatus('${docSnap.id}', 'INATIVO')">Inativar</button>
        </td>
      </tr>
    `;
    table.innerHTML += row;
  });
}

// Atualizar status + validade
window.atualizarStatus = async function (id, novoStatus) {
  const ref = doc(db, "assinaturas", id);

  if (novoStatus === "ATIVO") {
    // Validade de +30 dias
    const validade = new Date();
    validade.setDate(validade.getDate() + 30);

    await updateDoc(ref, { 
      status: "ATIVO", 
      validade: Timestamp.fromDate(validade) 
    });

    alert("✅ Usuário ativado por 30 dias!");
  } else {
    await updateDoc(ref, { status: "INATIVO" });
    alert("⚠️ Usuário inativado!");
  }

  carregarAssinaturas();
};
