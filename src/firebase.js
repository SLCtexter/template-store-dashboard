// src/firebase.js

// Import Firebase functions
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration (use your actual keys)
const firebaseConfig = { // InviteYou.lk firebase configration replaced the numbers with the old dashboard configuration.
  apiKey: "AIzaSyB0TnX10gHHtZBcOPxNjDHaBMAFJFeqYBA",
  authDomain: "templatesdashboard-8322b.firebaseapp.com",
  projectId: "templatesdashboard-8322b",
  storageBucket: "templatesdashboard-8322b.firebasestorage.app",
  messagingSenderId: "357807396277",
  appId: "1:357807396277:web:cb789d03853b09496135fc"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// ✅ Export db so it can be imported in RSVP.jsx
export { db };