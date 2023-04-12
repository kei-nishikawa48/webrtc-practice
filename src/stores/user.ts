import type { User } from "firebase/auth";
import { writable } from "svelte/store";

const user = writable<User | null>(null);
export { user };
