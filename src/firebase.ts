// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDplTScMFCKsSJIpjf_bc1t0GjVeaLctHI",
  authDomain: "kumakkoholdtypescript.firebaseapp.com",
  projectId: "kumakkoholdtypescript",
  storageBucket: "kumakkoholdtypescript.firebasestorage.app",
  messagingSenderId: "72387372475",
  appId: "1:72387372475:web:9447cf2ff41b5ce34ad09e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Storage初期化の修正（明示的なバケット指定）
const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);

// 開発環境でのログ
if (process.env.NODE_ENV === 'development') {
  const isLocalNetwork = process.env.REACT_APP_LOCAL_NETWORK === 'true';
  
  if (isLocalNetwork) {
    console.log('🏠 生活管理確認システム - ローカルネットワークモード');
  } else {
    console.log('🔧 Firebase初期化完了:', {
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      authDomain: firebaseConfig.authDomain
    });
  }
}

export { db, storage };