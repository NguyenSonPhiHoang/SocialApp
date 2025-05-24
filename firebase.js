// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCOSVXgspp55JjUADi3M2cPyE8ponddl2g",
  authDomain: "socialapp-37218.firebaseapp.com",
  projectId: "socialapp-37218",
  storageBucket: "socialapp-37218.firebasestorage.app",
  messagingSenderId: "937373678470",
  appId: "1:937373678470:web:9ccf52519e70d757670a07",
  measurementId: "G-TE67LZ8189"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
export const db = getFirestore(app);