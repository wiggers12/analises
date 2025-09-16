import { auth, db } from "./firebase.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// === Cadastro ===
window.cadastroEmail = async function () {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    await setDoc(doc(db, "assinaturas", userCredential.user.uid), {
      email: email,
      status: "INATIVO",
      validade: new Date()
    });
    alert("✅ Conta criada! Aguarde liberação do admin.");
  } catch (err) {
    alert("❌ Erro no cadastro: " + err.message);
  }
};

// === Login ===
window.loginEmail = async function () {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);

    // Busca assinatura
    const ref = doc(db, "assinaturas", userCredential.user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const dados = snap.data();
      const hoje = new Date();
      const validade = dados.validade?.toDate ? dados.validade.toDate() : new Date(dados.validade);

      if (dados.status === "ATIVO" && validade > hoje) {
        alert("✅ Login autorizado! Acesso liberado.");
        window.location.href = "index.html"; // ou dashboard
      } else {
        alert("⚠️ Sua assinatura expirou ou está inativa.");
      }
    } else {
      alert("⚠️ Nenhuma assinatura encontrada.");
    }
  } catch (err) {
    alert("❌ Erro no login: " + err.message);
  }
};
