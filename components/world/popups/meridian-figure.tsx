"use client";

import { useMemo } from "react";
import type { MeridianBodyPoint } from "@/lib/game/meridian-types";
import { POSE_BOX, silhouetteParts, type MeridianPose } from "./meridian-poses";

/** One ink silhouette in a training pose, under a full moon (SVG only — the points are drawn by the caller). */
export function MeridianSilhouette({ pose, idPrefix }: { pose: MeridianPose; idPrefix: string }) {
  const parts = useMemo(() => silhouetteParts(pose), [pose]);
  const rim = `${idPrefix}-rim`, body = `${idPrefix}-body`;
  return (
    <>
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#17110c" />
          <stop offset="1" stopColor="#060403" />
        </linearGradient>
        {/* Moonlight rim: a soft pale halo hugging the outline. */}
        <filter id={rim} x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="1.3" result="grow" />
          <feGaussianBlur in="grow" stdDeviation="2.2" result="blur" />
          <feFlood floodColor="#f6dfa0" floodOpacity="0.55" />
          <feComposite in2="blur" operator="in" result="halo" />
          <feMerge><feMergeNode in="halo" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter={`url(#${rim})`} fill={`url(#${body})`}>
        {parts.fills.map((d, i) => <path key={i} d={d} />)}
      </g>
    </>
  );
}

export const POSE_VIEWBOX = `0 0 ${POSE_BOX.w} ${POSE_BOX.h}`;

/** Thai names of the 28 body spots (tooltips). */
export const BODY_POINT_LABEL: Record<MeridianBodyPoint, string> = {
  crown: "กลางกระหม่อม", brow: "หว่างคิ้ว", throat: "ลำคอ", nape: "ท้ายทอย",
  l_shoulder: "บ่าซ้าย", r_shoulder: "บ่าขวา", chest: "กลางอก", heart: "ข้างหัวใจ", upper_back: "กลางหลังส่วนบน",
  l_elbow: "ข้อศอกซ้าย", r_elbow: "ข้อศอกขวา", l_wrist: "ข้อมือซ้าย", r_wrist: "ข้อมือขวา", l_palm: "ฝ่ามือซ้าย", r_palm: "ฝ่ามือขวา",
  solar: "ลิ้นปี่", navel: "สะดือ", dantian: "ตันเถียน", lower_back: "บั้นเอว", tailbone: "กระดูกก้นกบ",
  l_hip: "สะโพกซ้าย", r_hip: "สะโพกขวา", l_knee: "เข่าซ้าย", r_knee: "เข่าขวา", l_ankle: "ข้อเท้าซ้าย", r_ankle: "ข้อเท้าขวา",
  l_sole: "ฝ่าเท้าซ้าย", r_sole: "ฝ่าเท้าขวา",
};
