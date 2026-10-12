"use client";

// Joins the online session (lib/net/session.ts) to the stores: signed in, with
// a game and a server, the session gets the hero's name and body; its status
// and room size are mirrored into the online store for the HUD. The social
// socket (lib/net/social.ts) follows the character being played.
import { useEffect } from "react";
import { checkToken } from "@/lib/net/client";
import { onlineSession } from "@/lib/net/session";
import { gameServerUrl } from "@/lib/net/config";
import { signedIn, useOnlineStore } from "@/store/online-store";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { startCloudSession, useCloudSession } from "@/store/cloud-session";
import { socialSocket } from "@/lib/net/social";
import { heroLook } from "@/lib/world/appearance";
import { useSocialStore } from "@/store/social-store";

export function OnlineBridge() {
  // Server saves: resume / follow the save status / write on close (store/cloud-session.ts).
  useEffect(() => { startCloudSession(); }, []);

  const token = useOnlineStore((s) => (signedIn(s) ? s.token : null));
  const hasGame = useWorldStore((s) => s.hasGame);
  const name = useWorldStore((s) => s.playerBuild?.name ?? "");
  const body = useWorldStore((s) => (s.playerBodyId === "f1" ? "f1" : "m1"));

  // A saved token the server no longer accepts (a new server key) signs out,
  // so the account step asks for the password again instead of retrying forever.
  useEffect(() => {
    const server = gameServerUrl();
    if (!server || !token) return;
    let live = true;
    void checkToken(server, token).then((verdict) => {
      if (!live || verdict !== "rejected" || useOnlineStore.getState().token !== token) return;
      void useCloudSession.getState().signOut();
      toast("info", "กรุณาเข้าสู่ระบบอีกครั้ง");
    });
    return () => { live = false; };
  }, [token]);

  useEffect(() => {
    const server = gameServerUrl();
    onlineSession.configure(server && token && hasGame && name ? { server, token, name, body } : null);
  }, [token, hasGame, name, body]);

  // Friends, party, whispers, mail: one socket to the account's hub while a
  // character is played (docs/design/social.md); it hears who and where.
  const playing = useCloudSession((s) => (s.phase === "playing" ? s.current?.id ?? null : null));
  const location = useWorldStore((s) => s.currentSceneId);
  useEffect(() => {
    const server = gameServerUrl();
    const on = !!(server && token && playing);
    socialSocket.configure(on ? { server: server!, token: token! } : null);
    if (!on) useSocialStore.setState({ status: "off", loaded: false, lines: [], unread: 0, party: null, friends: [], mail: [], invites: [], requestsIn: [], requestsOut: [], blocked: [], card: null, whisperTo: null });
  }, [token, playing]);
  useEffect(() => {
    socialSocket.setHero(playing && name ? { name, body, location: location ?? null, characterId: playing } : null);
  }, [playing, name, body, location]);

  // The hero's look goes to the map room (others see the outfit and the weapon on the back).
  const lookOutfit = useWorldStore((s) => heroLook(s).outfit);
  const lookWeapon = useWorldStore((s) => heroLook(s).weapon);
  useEffect(() => { onlineSession.setLook({ outfit: lookOutfit, weapon: lookWeapon }); }, [lookOutfit, lookWeapon]);

  useEffect(() => onlineSession.subscribe(() => {
    const before = useOnlineStore.getState().status;
    useOnlineStore.setState({ status: onlineSession.status, roomSize: onlineSession.roomSize });
    if (before !== "replaced" && onlineSession.status === "replaced") toast("warn", "บัญชีนี้เข้าเล่นจากที่อื่นแล้ว · ตัดการเชื่อมต่อที่นี่");
  }), []);

  return null;
}
