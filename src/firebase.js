import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyByj72loEZ17uqg-E8rsruCYusokZl3_VY",
  authDomain: "minton-yoon.firebaseapp.com",
  projectId: "minton-yoon",
  storageBucket: "minton-yoon.firebasestorage.app",
  messagingSenderId: "426176265496",
  appId: "1:426176265496:web:caf68aa970a6148ae8f26d",
};

const app = initializeApp(firebaseConfig);

// 🔥 Firestore
export const db = getFirestore(app);

// 🔐 Auth
export const auth = getAuth(app);

// ✅ 로그인 상태 감시
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // 로그인 안 되어 있으면 → 익명 로그인
    signInAnonymously(auth).catch(console.error);
  }
});
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("🔥 Firebase UID:", user.uid, "익명:", user.isAnonymous);
  }
});
