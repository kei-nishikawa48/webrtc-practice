<script lang="ts">
	import { onMount } from 'svelte';
	import type { FireStoreUser } from '../../../../client/RTCClient';
	import { user } from '../../../../stores/user';
	export let member: FireStoreUser;
	let remoteVideoRef: HTMLVideoElement;

	onMount(() => {
		if ($user) {
			member.connection.setPeerIds($user.uid, member.id);
			member.connection.setRemoteVideoRef(remoteVideoRef);
			member.connection.setOnicecandidateCallback();
			member.connection.setOntrack();
			member.connection.offer();
		}
	});
</script>

<video bind:this={remoteVideoRef} playsinline autoplay muted={false} />
