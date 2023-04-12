import { writable } from "svelte/store";
import { RTCClient } from "../client/RTCClient";

export const rtcClient = writable<RTCClient>(new RTCClient());
