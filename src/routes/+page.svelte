<script lang="ts">
	import { onMount } from 'svelte';
	import { fireStore } from '../firebase_config';
	import { addDoc, collection, onSnapshot } from 'firebase/firestore';
	import { user } from '../stores/user';
	import { rtcClient } from '../stores/rtcClient';
	import { goto } from '$app/navigation';

	type Room = { name: string; host: string; id: string };
	let rooms: Room[] = [];
	let roomName: string;
	const createRoom = () => {
		addDoc(collection(fireStore, 'rooms'), { host: $user?.uid, name: roomName });
	};
	onMount(() => {
		onSnapshot(collection(fireStore, 'rooms'), (snapshot) => {
			rooms = snapshot.docs.map((doc) => {
				return { ...doc.data(), id: doc.id } as Room;
			});
		});
	});
	const joinRoom = async (roomId: string, roomName: string) => {
		if ($user) {
			$rtcClient.setLocalPeerId($user.uid);
			$rtcClient.setRoomId(roomId);
			$rtcClient.setRoomName(roomName);
			await $rtcClient.joinRoom({ name: $user.uid });
			await $rtcClient.getUserMedia();
			$rtcClient.listenRemoteUser();
			$rtcClient.listenSession();
			goto(`room/${roomId}`);
		}
	};
</script>

<h1>rooms</h1>
<form on:submit={createRoom}>
	<label>
		roomName
		<input type="text" bind:value={roomName} />
	</label>
	<button type="submit">createRoom</button>
</form>
{#each rooms as room}
	<div>
		<button on:click={async () => await joinRoom(room.id, room.name)}>{room.name}</button>
	</div>
{/each}
