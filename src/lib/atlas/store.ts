"use client";

import { useSyncExternalStore } from "react";
import { type Profile, loadProfile, saveProfile } from "./progress";
import { setMuted } from "./sound";

// One shared profile for the whole game, backed by localStorage.

let current: Profile | null = null;
const listeners = new Set<() => void>();

function get() {
  if (!current) {
    current = loadProfile();
    setMuted(current.muted);
  }
  return current;
}

export function setProfile(next: Profile | ((p: Profile) => Profile)) {
  current = typeof next === "function" ? next(get()) : next;
  setMuted(current.muted);
  saveProfile(current);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Null during server render / first hydration pass, then the saved profile. */
export function useProfile(): Profile | null {
  return useSyncExternalStore(subscribe, get, () => null);
}
