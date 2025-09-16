import { auth, db } from "./firebase.js";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Apenas admin autorizado
const adminEmail = "dionegalato1212@gmail.com";

// Verifica login
onAuthStateChanged(auth, (user) => {
  if (user && user.email === adminEmail) {
    carregarAssinaturas();
  } else {
    alert("Acesso negado. Apenas admin autorizado.");
    window.location.href = "login.html";
  }
});

// Carregar assinaturas
async function carregarAssinaturas() {
  const assinaturasRef = collection(db, "assinaturas");
  const snapshot = await getDocs(assinaturasRef);
  const table = document.getElementById("assinaturasTable");
  table.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const row = `
      <tr>
        <td>${data.email}</td>
        <td>${data.status}</td>
        <td>${data.validade || "Não definido"}</td>
        <td>
          <button onclick="atualizarStatus('${docSnap.id}', 'ATIVO')">Ativar</button>
          <button onclick="atualizarStatus('${docSnap.id}', 'INATIVO')">Inativar</button>
        </td>
      </tr>
    `;
    table.innerHTML += row;
  });
}

// Atualizar status
window.atualizarStatus = async function (id, novoStatus) {
  const ref = doc(db, "assinaturas", id);
  await updateDoc(ref, { status: novoStatus });
  alert(`✅ Usuário atualizado para ${novoStatus}`);
  carregarAssinaturas();
};
