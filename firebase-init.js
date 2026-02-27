import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAk3TYeyALujTKQbcW7wpmBmcoud6Gv06s",
  authDomain: "urh2-aaa13.firebaseapp.com",
  projectId: "urh2-aaa13",
  storageBucket: "urh2-aaa13.firebasestorage.app",
  messagingSenderId: "23035313137",
  appId: "1:23035313137:web:b4600526c3cfe37fea2250"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
