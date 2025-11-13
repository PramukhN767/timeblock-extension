// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);