// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmyUyxcdZLzpdO5sTLA4MRH2bj9YHcCEo",
  authDomain: "execution-budget.firebaseapp.com",
  projectId: "execution-budget",
  storageBucket: "execution-budget.firebasestorage.app",
  messagingSenderId: "729552531202",
  appId: "1:729552531202:web:75cba42e51bd8c8ef29c1b",
  measurementId: "G-Z0N6KG1GBQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 開発環境での接続強化
if (process.env.NODE_ENV === 'development') {
  // WebChannel接続の安定化
  console.log('🔧 Firestore接続設定を強化中...');
}

// Storage初期化の修正（明示的なバケット指定）
const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);

// 開発環境でのログ
if (process.env.NODE_ENV === 'development') {
  const isLocalNetwork = process.env.REACT_APP_LOCAL_NETWORK === 'true';
  
  if (isLocalNetwork) {
    console.log('🏠 実行予算管理システム - ローカルネットワークモード');
  } else {
    console.log('🔧 Firebase初期化完了:', {
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      authDomain: firebaseConfig.authDomain
    });
  }
}

export { db, storage };