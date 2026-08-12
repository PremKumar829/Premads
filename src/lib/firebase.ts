import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, query, where, orderBy, limit } from "firebase/firestore";
import firebaseConfigJson from "../../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: process.env.FIREBASE_APP_ID || firebaseConfigJson.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const databaseId = process.env.FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || "(default)";

export const db = getFirestore(app, databaseId);

export {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
};
