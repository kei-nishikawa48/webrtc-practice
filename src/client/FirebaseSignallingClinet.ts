import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	setDoc,
} from "firebase/firestore";
import { fireStore } from "../firebase_config";

export default class FirebaseSignallingClient {
	roomId: string;
	localPeerId: string;
	remotePeerId: string;
	constructor() {
		this.roomId = "";
		this.localPeerId = "";
		this.remotePeerId = "";
	}
	setRoomId(roomId: string) {
		this.roomId = roomId;
	}
	setPeerIds(localPeerId: string, remotePeerId: string) {
		this.localPeerId = localPeerId;
		this.remotePeerId = remotePeerId;
	}
	async joinRoom(user: { name: string }) {
		const ref = doc(
			fireStore,
			`rooms/${this.roomId}/member/${this.localPeerId}`,
		);
		const connections = await getDocs(collection(ref, "connection"));
		const document = await getDoc(ref);
		if (document.exists()) {
			deleteDoc(ref);
			connections.docs.forEach((doc) => {
				deleteDoc(doc.ref);
			});
		}
		setDoc(ref, user);
	}

	async sendOffer(sessionDescription: RTCSessionDescription) {
		await setDoc(this.targetRef, {
			type: "offer",
			sender: this.localPeerId,
			sessionDescription,
		});
	}

	async sendAnswer(sessionDescription: RTCSessionDescription) {
		await setDoc(this.targetRef, {
			type: "answer",
			sender: this.localPeerId,
			sessionDescription,
		});
	}
	get targetRef() {
		return doc(
			fireStore,
			`rooms/${this.roomId}/member/${this.remotePeerId}/connection/${this.localPeerId}`,
		);
	}
	async remove(path: string) {
		await deleteDoc(doc(fireStore, path));
	}
	async sendCandidate(candidate: RTCIceCandidateInit) {
		await setDoc(this.targetRef, {
			type: "candidate",
			sender: this.localPeerId,
			candidate,
		});
	}
}
