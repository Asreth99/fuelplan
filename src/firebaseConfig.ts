// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAz3VnS6LXzgld7ds9JieocItwm2rfN0qg",
  authDomain: "fuelplan-fbaca.firebaseapp.com",
  projectId: "fuelplan-fbaca",
  storageBucket: "fuelplan-fbaca.firebasestorage.app",
  messagingSenderId: "69838766185",
  appId: "1:69838766185:web:e0a1091303c0edfa70e2f8",
  measurementId: "G-KV58TXSHS7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
