import { auth, db } from "./firebase.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { 
  doc, 
  setDoc, 
  getDoc, 
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// === Cadastro ===
window.cadastroEmail = async function () {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    await setDoc(doc(db, "assinaturas", userCredential.user.uid), {
      email: email,
      status: "INATIVO", // só admin ativa
      validade: null // admin define a validade depois
    });
    alert("✅ Conta criada! Aguarde liberação do admin.");
  } catch (err) {
    alert("❌ Erro no cadastro: " + err.message);
    console.error("Erro cadastro:", err);
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
      let validade = null;

      if (dados.validade) {
        validade = dados.validade?.toDate ? dados.validade.toDate() : new Date(dados.validade);
      }

      // Agora basta estar ATIVO (e validade maior que hoje se existir)
      if (dados.status === "ATIVO" && (!validade || validade > hoje)) {
        alert("✅ Login autorizado! Acesso liberado.");
        window.location.href = "index.html"; // direciona pro home/dashboard
      } else {
        alert("⚠️ Sua assinatura expirou ou está inativa.");
      }
    } else {
      alert("⚠️ Nenhuma assinatura encontrada.");
    }
  } catch (err) {
    alert("❌ Erro no login: " + err.message);
    console.error("Erro login:", err);
  }
};
