<script lang="ts">
	import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
	import { auth } from '../../firebase_config';
	import { goto } from '$app/navigation';

	let email: string;
	let password: string;
	const handleSubmit = async () => {
		await createUserWithEmailAndPassword(auth, email, password);
		goto('/');
	};
</script>

<h1>signUp</h1>
<form on:submit={handleSubmit}>
	<label>
		email
		<input type="email" bind:value={email} />
	</label>
	<label>
		password
		<input type="password" bind:value={password} />
	</label>
	<button type="submit">signup</button>
</form>

<a href="/login">アカウントをお持ちの方はこちら</a>
