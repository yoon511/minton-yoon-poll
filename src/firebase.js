import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // 👇 여기에 Firebase 콘솔에서 복사한 값 그대로 붙여넣기
   apiKey: "AIzaSyByj72loEZ17uqg-E8rsruCYusokZl3_VY",
  authDomain: "minton-yoon.firebaseapp.com",
  projectId: "minton-yoon",
  storageBucket: "minton-yoon.firebasestorage.app",
  messagingSenderId: "426176265496",
  appId: "1:426176265496:web:caf68aa970a6148ae8f26d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
