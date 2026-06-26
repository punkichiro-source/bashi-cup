import { GAME } from "@/lib/game/config";

export function formatBashi(n: number): string {
  return `${n.toLocaleString("en-US")} ${GAME.currency}`;
}

export function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
