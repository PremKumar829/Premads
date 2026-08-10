import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyCJIU56dxgxS2cIh99zSvp_FAn9hrSSl0g",
  authDomain: "prime-earn-49202.firebaseapp.com",
  databaseURL: "https://prime-earn-49202-default-rtdb.firebaseio.com",
  projectId: "prime-earn-49202",
  storageBucket: "prime-earn-49202.firebasestorage.app",
  messagingSenderId: "533446392320",
  appId: "1:533446392320:web:17bb62fbef2ce4250eb6e5",
  measurementId: "G-T48CN93S5X"
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Connectivity Status helper
export async function checkFirebaseConnection(): Promise<{ connected: boolean; projectId: string; error?: string }> {
  try {
    // Attempt reading from Firestore server connection
    await getDocFromServer(doc(db, '_connection_check', 'ping'));
    return { connected: true, projectId: firebaseConfig.projectId };
  } catch (error: any) {
    // Ignore permissions or document not found errors as long as server responded
    if (error?.code === 'not-found' || error?.code === 'permission-denied') {
      return { connected: true, projectId: firebaseConfig.projectId };
    }
    return {
      connected: false,
      projectId: firebaseConfig.projectId,
      error: error?.message || 'Connection check timed out'
    };
  }
}
