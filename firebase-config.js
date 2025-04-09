// Firebase configuration
const firebaseConfig = {
    // TODO: Replace with your Firebase project configuration
    apiKey: "AIzaSyAzRhzeGeIR8VUZ5nJ7qT6TLllZWFM9_wM",
    authDomain: "atmovault-3a734.firebaseapp.com",
    projectId: "atmovault-3a734",
    storageBucket: "atmovault-3a734.firebasestorage.app",
    messagingSenderId: "772873696815",
    appId: "1:772873696815:web:64b244bdc6f810642738da",
    measurementId: "G-7C8RY5SNZD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Create references to Firebase services
const auth = firebase.auth();
const db = firebase.firestore();