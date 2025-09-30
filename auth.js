/* ==============================
   IMPORTS FIREBASE
============================== */
import { auth, db } from "./firebase.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { 
  doc, 
  setDoc, 
  getDoc, 
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ==============================
   REGISTRO
============================== */
window.registrarUsuario = async function () {
  const email = document.getElementById("emailRegistro").value;
  const senha = document.getElementById("senhaRegistro").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);

    // Cria assinatura como INATIVO até admin liberar
    await setDoc(doc(db, "assinaturas", userCredential.user.uid), {
      email: email,
      status: "INATIVO",
      validade: null
    });

    alert("✅ Conta criada! Aguarde liberação do admin.");
    document.getElementById("registroForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
  } catch (err) {
    alert("❌ Erro no cadastro: " + err.message);
    console.error("Erro cadastro:", err);
  }
};

/* ==============================
   LOGIN
============================== */
window.loginUsuario = async function () {
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);

    const ref = doc(db, "assinaturas", userCredential.user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const dados = snap.data();
      const hoje = new Date();
      let validade = null;

      if (dados.validade) {
        validade = dados.validade?.toDate ? dados.validade.toDate() : new Date(dados.validade);
      }

      if (dados.status === "ATIVO" && (!validade || validade > hoje)) {
        alert("✅ Login autorizado! Bem-vindo(a).");
        document.getElementById("loginModal").style.display = "none"; 
      } else {
        alert("⚠️ Sua assinatura expirou ou está inativa. Aguarde liberação.");
        await signOut(auth);
      }
    } else {
      alert("⚠️ Nenhuma assinatura encontrada.");
      await signOut(auth);
    }
  } catch (err) {
    alert("❌ Erro no login: " + err.message);
    console.error("Erro login:", err);
  }
};

/* ==============================
   TROCAR LOGIN / LOGOUT
============================== */
window.mostrarRegistro = function () {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registroForm").style.display = "block";
};
window.mostrarLogin = function () {
  document.getElementById("registroForm").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
};

window.logoutUsuario = async function () {
  await signOut(auth);
  alert("🚪 Logout realizado com sucesso.");
  document.getElementById("btnLogin").style.display = "inline";
  document.getElementById("btnLogout").style.display = "none";
  document.getElementById("loginModal").style.display = "flex";
};

/* ==============================
   BLOQUEAR USUÁRIOS SEM LOGIN
============================== */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    document.getElementById("btnLogin").style.display = "inline";
    document.getElementById("btnLogout").style.display = "none";
    document.getElementById("loginModal").style.display = "flex";
  } else {
    const ref = doc(db, "assinaturas", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists() || snap.data().status !== "ATIVO") {
      document.getElementById("btnLogin").style.display = "inline";
      document.getElementById("btnLogout").style.display = "none";
      document.getElementById("loginModal").style.display = "flex";
    } else {
      document.getElementById("btnLogin").style.display = "none";
      document.getElementById("btnLogout").style.display = "inline";
      document.getElementById("loginModal").style.display = "none";
    }
  }
});
