/** Foreground silhouettes traced from the existing 960 × 640 map paintings.
 * Each contour reuses those exact background pixels; the depth is its ground contact.
 * Other locations keep their original authored painting until silhouettes are available.
 */
export interface WorldForeground {
  depth: number;
  contours: readonly (readonly (readonly [number, number])[])[];
}

export function worldForeground(key: string, image: string): readonly WorldForeground[] {
  if (key !== "home_player" || image !== "/maps/home_player.png") return [];
  return [
    {
      // The tiled gate roof and its two posts, leaving the doorway open.
      depth: 547,
      contours: [
        [[417, 442], [429, 434], [426, 422], [435, 422], [440, 427], [499, 416], [507, 414], [510, 408], [516, 410], [521, 433], [532, 442], [536, 447], [520, 456], [466, 469], [435, 461]],
        [[433, 459], [448, 466], [450, 544], [437, 551], [429, 544], [429, 495], [435, 490]],
        [[502, 457], [515, 453], [520, 474], [532, 472], [532, 519], [520, 529], [505, 530]],
      ],
    },
    {
      // The well's timber frame and stone basin share its front ground line.
      depth: 358,
      contours: [
        [[488, 318], [497, 307], [513, 303], [535, 308], [552, 320], [554, 343], [543, 355], [519, 360], [497, 351], [487, 337]],
        [[494, 288], [500, 288], [500, 280], [505, 280], [505, 314], [497, 318]],
        [[541, 279], [544, 270], [549, 274], [550, 316], [544, 316]],
        [[500, 289], [543, 280], [546, 287], [501, 296]],
      ],
    },
  ];
}
