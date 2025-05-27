import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { FIREBASE_API_KEY } from '@env';
import { FIREBASE_AUTH_DOMAIN } from '@env';
import { FIREBASE_PROJECT_ID } from '@env';
import { FIREBASE_STORAGE_BUCKET } from '@env';
import { FIREBASE_messagingSenderId } from '@env';
import { FIREBASE_appId } from '@env';
import { FIREBASE_measurementId } from '@env';

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_messagingSenderId,
  appId: FIREBASE_appId,
  measurementId: FIREBASE_measurementId
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
export const db = getFirestore(app);