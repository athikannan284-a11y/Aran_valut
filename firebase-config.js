// Firebase Configuration - Real credentials from your project
const firebaseConfig = {
  apiKey: "AIzaSyAnf6HacQmZUMksmf3DFpnQIQMl5WKBecs",
  authDomain: "aran-vault.firebaseapp.com",
  projectId: "aran-vault",
  storageBucket: "aran-vault.firebasestorage.app",
  messagingSenderId: "747513188702",
  appId: "1:747513188702:web:b14ca7ed7e066dfab77fcf",
  measurementId: "G-1JGFE13EXC"
};

// Initialize Firebase
firebase.initializeApp({
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey.trim()
});

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configure Recaptcha for OTP
window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('btn-send-otp', {
  'size': 'invisible',
  'callback': (response) => {
    // reCAPTCHA solved, allow sendOTP.
  }
});
