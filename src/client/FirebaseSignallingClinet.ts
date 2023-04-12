import { collection, deleteDoc, doc, setDoc } from "firebase/firestore";
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
		setDoc(
			doc(fireStore, `rooms/${this.roomId}/member/${this.localPeerId}`),
			user,
		);
	}
	async joinRoomVideo(user: { name: string }) {
		setDoc(doc(fireStore, `rooms/${this.roomId}/member/video`), user);
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
