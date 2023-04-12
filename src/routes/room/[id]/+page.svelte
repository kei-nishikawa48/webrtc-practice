<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { rtcClient } from '../../../stores/rtcClient';
	import { user } from '../../../stores/user';
	import RemoteVideo from './_components/RemoteVideo.svelte';
	import { goto } from '$app/navigation';
	let videoRef: HTMLVideoElement;
	let muted = false;
	let videoON = true;
	onMount(() => {
		(async () => {
			if ($rtcClient.localMediaStream) {
				videoRef.srcObject = $rtcClient.localMediaStream;
			}
		})();
	});
	const handleMuteButtonClick = () => {
		muted = !muted;
		$rtcClient.toggleAudio();
	};
	const handleVideoOnButtonClick = () => {
		videoON = !videoON;
		$rtcClient.toggleVideo();
	};
	const handleLeave = async () => {
		await $rtcClient.removeConnection();
		goto('/');
	};
	onDestroy(async () => {
		await $rtcClient.removeConnection();
	});
</script>

<p>{$rtcClient.roomName}</p>
<video playsinline bind:this={videoRef} autoplay muted={true} />

<button on:click={handleMuteButtonClick}>
	{muted ? 'ミュート解除' : 'ミュートする'}
</button>
<button on:click={handleVideoOnButtonClick}>
	{videoON ? 'ビデオオフにする' : 'ビデオオンにする'}
</button>
<button on:click={handleLeave}>退出</button>
<!-- <button on:click={handleDisplayView}> 画面共有 </button> -->

{#each $rtcClient.member as user}
	<RemoteVideo member={user} />
{/each}
