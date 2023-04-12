<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { auth } from '../firebase_config';
	import { user } from '../stores/user';
	import type { Unsubscribe } from 'firebase/auth';
	import { goto } from '$app/navigation';
	let subscribe: Unsubscribe;
	onMount(() => {
		subscribe = auth.onAuthStateChanged((firebaseUser) => {
			if (firebaseUser) {
				user.set(firebaseUser);
				goto('/');
			} else {
				goto('/login');
			}
		});
	});
	onDestroy(() => {
		if (subscribe) {
			subscribe();
		}
	});
</script>

<slot />
