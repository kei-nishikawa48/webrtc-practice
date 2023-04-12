// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
	apiKey: "AIzaSyAdf-DvnPu1zi1Lo05AFIxZZ_t5V74ppao",
	authDomain: "webrtc-react-firebase-8ee27.firebaseapp.com",
	projectId: "webrtc-react-firebase-8ee27",
	storageBucket: "webrtc-react-firebase-8ee27.appspot.com",
	messagingSenderId: "691864838613",
	appId: "1:691864838613:web:416b6b32ac3fa3b16b5d5c",
};

const app = initializeApp(firebaseConfig);
const fireStore = getFirestore(app);
const auth = getAuth(app);
export { fireStore, auth };
export default app;
