"use client";

// Joins the online session (lib/net/session.ts) to the stores: signed in, with
// a game and a server, the session gets the hero's name and body; its status
// and room size are mirrored into the online store for the HUD.
import { useEffect } from "react";
import { onlineSession } from "@/lib/net/session";
import { gameServerUrl } from "@/lib/net/config";
import { signedIn, useOnlineStore } from "@/store/online-store";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";

export function OnlineBridge() {
  const token = useOnlineStore((s) => (signedIn(s) ? s.token : null));
  const hasGame = useWorldStore((s) => s.hasGame);
  const name = useWorldStore((s) => s.playerBuild?.name ?? "");
  const body = useWorldStore((s) => (s.playerBodyId === "f1" ? "f1" : "m1"));

  useEffect(() => {
    const server = gameServerUrl();
    onlineSession.configure(server && token && hasGame && name ? { server, token, name, body } : null);
  }, [token, hasGame, name, body]);

  useEffect(() => onlineSession.subscribe(() => {
    const before = useOnlineStore.getState().status;
    useOnlineStore.setState({ status: onlineSession.status, roomSize: onlineSession.roomSize });
    if (before !== "replaced" && onlineSession.status === "replaced") toast("warn", "บัญชีนี้เข้าเล่นจากที่อื่นแล้ว · ตัดการเชื่อมต่อที่นี่");
  }), []);

  return null;
}
