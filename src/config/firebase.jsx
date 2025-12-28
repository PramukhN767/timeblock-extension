import { initializeApp } from "firebase/app";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfD-VhEJGVtHGuJ3cSn-KXf_jJzYDYf0c",
  authDomain: "timeblock-extension.firebaseapp.com",
  projectId: "timeblock-extension",
  storageBucket: "timeblock-extension.firebasestorage.app",
  messagingSenderId: "361951736874",
  appId: "1:361951736874:web:58af4df5a1aec2c9e33f53",
  measurementId: "G-KHV83L36L7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export { app };
export default firebaseConfig;