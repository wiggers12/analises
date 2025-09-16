// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuração do Firebase (seu projeto analises-tecnicas)
const firebaseConfig = {
  apiKey: "AIzaSyA430IFeF_f8Z_DGgQCDg6EbXBQ6pei-1k",
  authDomain: "analises-tecnicas.firebaseapp.com",
  projectId: "analises-tecnicas",
  storageBucket: "analises-tecnicas.firebasestorage.app", // ✅ manter como está no console
  messagingSenderId: "27903942755",
  appId: "1:27903942755:web:3a4bfd623e0b13479e1856",
  measurementId: "G-5PSFEV9208"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exportar para outros arquivos
export { app, auth, db };
