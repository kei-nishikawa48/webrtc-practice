import {
	collection,
	deleteDoc,
	doc,
	getDocs,
	onSnapshot,
} from "firebase/firestore";
import { rtcClient } from "../stores/rtcClient";
import FirebaseSignallingClient from "./FirebaseSignallingClinet";
import { fireStore } from "../firebase_config";
const config = {
	iceServers: [{ urls: "stun:stun.stunprotocol.org" }],
};
export type FireStoreUser = {
	name: string;
	id: string;
	connection: Connection;
};
type SessionDescriptionData = {
	sender: string;
	type: "offer" | "answer";
	sessionDescription: RTCSessionDescription;
};
type CandidateData = {
	sender: string;
	type: "candidate";
	candidate: RTCIceCandidateInit;
};
export class RTCClient {
	member: FireStoreUser[] = [];
	connections: Connection[] = [];
	firebaseSignallingClient: FirebaseSignallingClient;
	localMediaStream?: MediaStream;
	localVideoMediaStream?: MediaStream;
	localPeerId?: string;
	roomId?: string;
	roomName?: string;
	constructor() {
		this.firebaseSignallingClient = new FirebaseSignallingClient();
	}
	setLocalPeerId(localPeerId: string) {
		this.localPeerId = localPeerId;
	}
	setRoomId(roomId: string) {
		this.roomId = roomId;
	}
	setRoomName(roomName: string) {
		this.roomName = roomName;
	}
	setRtcClient() {
		rtcClient.set(this);
	}
	async getUserMedia() {
		try {
			const constraints = { audio: true, video: true };
			this.localMediaStream = await navigator.mediaDevices.getUserMedia(
				constraints,
			);
		} catch (er) {
			console.error(er);
		}
	}
	addConnection() {
		const connection = new Connection(this.firebaseSignallingClient);
		this.connections.push(connection);
		return connection;
	}
	async getDisplayMedia() {
		try {
			const constraints = { video: true };
			const stream = await navigator.mediaDevices.getDisplayMedia(constraints);

			return stream;
		} catch (er) {
			console.error(er);
		}
	}
	listenRemoteUser() {
		onSnapshot(
			collection(fireStore, `rooms/${this.roomId}/member`),
			(snapshot) => {
				const member = snapshot.docChanges().flatMap((v) => {
					if (v.doc.id === this.localPeerId) {
						return [];
					} else {
						if (v.type === "added") {
							const connection = this.addConnection();
							connection.addTracks(
								this.videoTrack,
								this.audioTrack,
								this.localMediaStream,
							);

							return {
								...v.doc.data(),
								id: v.doc.id,
								connection,
							} as FireStoreUser;
						} else if (v.type === "removed") {
							this.member = this.member.filter(
								(member) => member.id !== v.doc.id,
							);
							return [];
						} else {
							return [];
						}
					}
				});
				this.member = [...this.member, ...member];
				this.setRtcClient();
			},
		);
		this.setRtcClient();
	}
	async joinRoom(user: { name: string }) {
		if (this.roomId && this.localPeerId) {
			this.firebaseSignallingClient.setRoomId(this.roomId);
			this.firebaseSignallingClient.setPeerIds(this.localPeerId, "");
		}
	}
	async removeConnection() {
		await deleteDoc(
			doc(fireStore, `rooms/${this.roomId}/member/${this.localPeerId}`),
		);
		const memberConnections = await getDocs(
			collection(
				fireStore,
				`rooms/${this.roomId}/member/${this.localPeerId}/connection/`,
			),
		);
		memberConnections.docs.forEach((document) => {
			deleteDoc(
				doc(
					fireStore,
					`rooms/${this.roomId}/member/${this.localPeerId}/connection/${document.id}`,
				),
			);
			deleteDoc(
				doc(
					fireStore,
					`rooms/${this.roomId}/member/${document.id}/connection/${this.localPeerId}`,
				),
			);
		});
	}
	listenSession() {
		console.log("listen...");
		onSnapshot(
			collection(
				fireStore,
				`rooms/${this.roomId}/member/${this.localPeerId}/connection`,
			),
			async (snapshot) => {
				snapshot.docs.forEach(async (doc) => {
					const data = doc.data() as SessionDescriptionData | CandidateData;

					if (!doc.exists()) {
						return;
					}
					const { type, sender } = data;
					const connection = this.connections.find(
						(v) => v.remotePeerId === doc.id,
					);
					if (type === "offer") {
						console.log("offer");
						const { sessionDescription } = data;
						await connection?.answer(sender, sessionDescription);
						console.log("send answer");
					} else if (type === "answer") {
						console.log("get answer");
						const { sessionDescription } = data;
						await connection?.saveReceivedSessionDescription(
							sessionDescription,
						);
					} else if (type === "candidate") {
						const { candidate } = data;
						console.log("candidate");
						await connection?.addIceCandidate(candidate);
					}
					this.setRtcClient();
				});
			},
		);
	}
	toggleAudio() {
		if (this.audioTrack) {
			this.audioTrack.enabled = !this.audioTrack.enabled;
			this.setRtcClient();
		}
	}
	toggleVideo() {
		if (this.videoTrack) {
			this.videoTrack.enabled = !this.videoTrack.enabled;
			this.setRtcClient();
		}
	}
	get audioTrack() {
		return this.localMediaStream?.getAudioTracks()[0];
	}
	get videoTrack() {
		return this.localMediaStream?.getVideoTracks()[0];
	}
}
class Connection {
	rtcPeerConnection: RTCPeerConnection;
	remoteVideoRef: HTMLVideoElement | null;
	localPeerId?: string;
	remotePeerId?: string;
	constructor(public firebaseSignallingClient: FirebaseSignallingClient) {
		this.rtcPeerConnection = new RTCPeerConnection(config);
		this.remoteVideoRef = null;
	}
	setRemoteVideoRef(remoteVideoRef: HTMLVideoElement) {
		this.remoteVideoRef = remoteVideoRef;
	}

	setPeerIds(localPeerId: string, remotePeerId: string) {
		this.localPeerId = localPeerId;
		this.remotePeerId = remotePeerId;
	}
	addTracks(
		videoTrack?: MediaStreamTrack,
		audioTrack?: MediaStreamTrack,
		mediaStream?: MediaStream,
	) {
		this.addAudioTrack(audioTrack, mediaStream);
		this.addVideoTrack(videoTrack, mediaStream);
	}
	addAudioTrack(audioTrack?: MediaStreamTrack, mediaStream?: MediaStream) {
		if (audioTrack && mediaStream) {
			this.rtcPeerConnection.addTrack(audioTrack, mediaStream);
		}
	}
	addVideoTrack(videoTrack?: MediaStreamTrack, mediaStream?: MediaStream) {
		if (videoTrack && mediaStream) {
			this.rtcPeerConnection.addTrack(videoTrack, mediaStream);
		}
	}

	setOnicecandidateCallback() {
		this.rtcPeerConnection.onicecandidate = async ({ candidate }) => {
			//stan serverから自分のipアドレスの情報を教えてくれる
			if (candidate) {
				console.log({ candidate });
				//todo:リモートに通信経路(candidate)を通知する
				await this.firebaseSignallingClient.sendCandidate(candidate.toJSON());
			}
		};
	}
	setOntrack() {
		this.rtcPeerConnection.ontrack = (rtcTrackEvent) => {
			if (rtcTrackEvent) {
				if (this.remoteVideoRef === null) return;
				if (rtcTrackEvent.track.kind !== "video") return;
				const remoteMediaStream = rtcTrackEvent.streams[0];
				this.remoteVideoRef.srcObject = remoteMediaStream;
			}
		};
	}
	async offer() {
		const sessionDescription = await this.createOffer();
		if (!this.rtcPeerConnection.currentLocalDescription) {
			console.log("setLocalDescription");
			await this.setLocalDescription(sessionDescription);
			await this.sendOffer();
			console.log("sendOffer");
		}
	}
	private async createOffer() {
		try {
			return await this.rtcPeerConnection.createOffer();
		} catch (er) {
			console.error(er);
		}
	}
	private async setLocalDescription(
		sessionDescription: RTCSessionDescriptionInit | undefined,
	) {
		try {
			await this.rtcPeerConnection.setLocalDescription(sessionDescription);
		} catch (er) {
			console.error(er);
		}
	}
	async sendOffer() {
		if (this.localPeerId && this.remotePeerId) {
			this.firebaseSignallingClient.setPeerIds(
				this.localPeerId,
				this.remotePeerId,
			);
		}
		if (this.localDescription) {
			await this.firebaseSignallingClient.sendOffer(this.localDescription);
		}
	}
	async answer(sender: string, sessionDescription: RTCSessionDescription) {
		try {
			this.remotePeerId = sender;
			this.setOnicecandidateCallback();
			this.setOntrack();
			const SessionDescription = new RTCSessionDescription(sessionDescription);
			console.log("setRemoteDescription", SessionDescription);
			await this.setRemoteDescription(sessionDescription);
			const answer = await this.rtcPeerConnection.createAnswer();
			console.log("setLocalDescription answer:", answer);
			await this.rtcPeerConnection.setLocalDescription(answer);
			console.log("send answer");
			await this.sendAnswer();
		} catch (er) {
			console.error(er);
		}
	}
	async setRemoteDescription(remoteDescription: RTCSessionDescription) {
		const RemoteDescription = new RTCSessionDescription(remoteDescription);
		await this.rtcPeerConnection.setRemoteDescription(RemoteDescription);
	}
	async sendAnswer() {
		if (this.localPeerId && this.remotePeerId) {
			this.firebaseSignallingClient.setPeerIds(
				this.localPeerId,
				this.remotePeerId,
			);
		}
		await this.firebaseSignallingClient.sendAnswer(this.localDescription);
	}
	async saveReceivedSessionDescription(
		sessionDescription: RTCSessionDescription,
	) {
		try {
			const SessionDescription = new RTCSessionDescription(sessionDescription);

			await this.setRemoteDescription(SessionDescription);
		} catch (er) {
			console.error(er);
		}
	}
	async addIceCandidate(candidate: RTCIceCandidateInit) {
		try {
			const iceCandidate = new RTCIceCandidate(candidate);
			if (iceCandidate.usernameFragment === candidate.usernameFragment) {
				return;
			}
			if (this.rtcPeerConnection.remoteDescription) {
				console.log("iceCandidate:", iceCandidate);
				await this.rtcPeerConnection.addIceCandidate(iceCandidate);
			}
		} catch (er) {
			console.error(er);
		}
	}

	get localDescription() {
		return this.rtcPeerConnection.localDescription?.toJSON();
	}
}
