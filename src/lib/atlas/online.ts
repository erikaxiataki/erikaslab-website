import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { SCOPES, type Scope } from "./countries";
import { DIFFICULTY, type Difficulty, MODES, type Mode } from "./game";
import { isSafeAvatar, isSafeInitials, isSafeNickname } from "./identity";

// Live rooms use Supabase Realtime Broadcast + Presence only: nothing is written to a database,
// and a room disappears as soon as everyone leaves.

export const MAX_PLAYERS = 8;
export const REACTIONS = ["🔥", "😎", "😂", "👏", "😱", "😢", "GG"] as const;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I look-alikes

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supabase's dashboard now calls this the "publishable" key; accept either name.
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const onlineEnabled = Boolean(URL && KEY);

let client: Promise<SupabaseClient> | null = null;
function getClient() {
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(URL as string, KEY as string, { auth: { persistSession: false } }),
  );
  return client;
}

export function makeRoomCode() {
  let code = "";
  for (let i = 0; i < 5; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return code;
}

export function normalizeRoomCode(input: string) {
  return input
    .toUpperCase()
    .split("")
    .filter((ch) => CODE_ALPHABET.includes(ch))
    .join("")
    .slice(0, 5);
}

export type Player = { id: string; name: string; avatar: string; initials: string; joinedAt: number };

export type GameSettings = { seed: number; mode: Mode; scope: Scope; difficulty: Difficulty; count: number };

export type RoomEvent =
  | { type: "start"; settings: GameSettings; round: number }
  | { type: "answer"; id: string; round: number; q: number; correct: boolean; points: number; ms: number }
  | { type: "next"; round: number; q: number }
  | { type: "react"; id: string; emoji: string };

export type RoomHandlers = {
  onPlayers: (players: Player[]) => void;
  onEvent: (e: RoomEvent) => void;
  onStatus: (status: "connecting" | "connected" | "full" | "error") => void;
};

/** Drops anything that doesn't look exactly like one of our own events. */
function validEvent(e: unknown): e is RoomEvent {
  if (!e || typeof e !== "object") return false;
  const ev = e as Record<string, unknown>;
  const int = (v: unknown) => Number.isInteger(v) && (v as number) >= 0;
  switch (ev.type) {
    case "start": {
      const s = ev.settings as Record<string, unknown> | undefined;
      return (
        !!s &&
        int(ev.round) &&
        int(s.seed) &&
        MODES.some((m) => m.id === s.mode) &&
        SCOPES.includes(s.scope as Scope) &&
        typeof s.difficulty === "string" &&
        s.difficulty in DIFFICULTY &&
        int(s.count) &&
        (s.count as number) <= 30
      );
    }
    case "answer":
      return typeof ev.id === "string" && int(ev.round) && int(ev.q) && typeof ev.correct === "boolean" && int(ev.points) && int(ev.ms) && (ev.points as number) < 5000;
    case "next":
      return int(ev.round) && int(ev.q);
    case "react":
      return typeof ev.id === "string" && REACTIONS.includes(ev.emoji as (typeof REACTIONS)[number]);
    default:
      return false;
  }
}

export class Room {
  private channel: RealtimeChannel | null = null;
  private closed = false;

  constructor(
    readonly code: string,
    readonly me: Player,
    private handlers: RoomHandlers,
  ) {}

  async connect() {
    this.handlers.onStatus("connecting");
    const supabase = await getClient();
    if (this.closed) return;
    const channel = supabase.channel(`atlas-room:${this.code}`, {
      config: { broadcast: { self: true }, presence: { key: this.me.id, enabled: true } },
    });
    this.channel = channel;

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<Player>();
      const players = Object.values(state)
        .map((metas) => metas[0])
        .filter((p): p is typeof p & Player => !!p && isSafeNickname(p.name) && isSafeAvatar(p.avatar))
        .map(({ id, name, avatar, initials, joinedAt }) => ({ id, name, avatar, initials: isSafeInitials(initials) ? initials : "", joinedAt }))
        .sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id));
      // The room is full for whoever joined last.
      const mine = players.findIndex((p) => p.id === this.me.id);
      if (mine >= MAX_PLAYERS) {
        this.handlers.onStatus("full");
        void this.leave();
        return;
      }
      this.handlers.onPlayers(players.slice(0, MAX_PLAYERS));
    });

    channel.on("broadcast", { event: "room" }, ({ payload }) => {
      if (validEvent(payload)) this.handlers.onEvent(payload);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track(this.me);
        this.handlers.onStatus("connected");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        this.handlers.onStatus("error");
      }
    });
  }

  send(e: RoomEvent) {
    void this.channel?.send({ type: "broadcast", event: "room", payload: e });
  }

  async leave() {
    this.closed = true;
    const channel = this.channel;
    this.channel = null;
    if (!channel) return;
    await channel.untrack().catch(() => {});
    const supabase = await getClient();
    await supabase.removeChannel(channel);
  }
}
