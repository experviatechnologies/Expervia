// Generates the ETEN app icons (installable app, browser tab, iPhone home
// screen) from the Expervia dot mark, redrawn here as vector so every size is
// sharp. Run after changing the mark or colours:
//
//   node scripts/generate-app-icons.mjs
//
// Writes public/icons/*.png, src/app/icon.svg, src/app/apple-icon.png and
// src/app/favicon.ico.

import { writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";

const PURPLE = "#4a16c4";
const WHITE = "#ffffff";

/** The 3x3 dot mark in a 108x108 box. Links run down-left between dots. */
function mark(fill) {
  const c = [17, 54, 91];
  const r = 15.5;
  const dots = c.flatMap((y) =>
    c.map((x) => `<circle cx="${x}" cy="${y}" r="${r}"/>`),
  );
  // [fromCol, fromRow, toCol, toRow]
  const links = [
    [1, 0, 0, 1],
    [2, 0, 1, 1],
    [1, 1, 0, 2],
    [2, 1, 1, 2],
  ].map(
    ([a, b, x, y]) =>
      `<line x1="${c[a]}" y1="${c[b]}" x2="${c[x]}" y2="${c[y]}" stroke-width="12" stroke-linecap="round"/>`,
  );
  return `<g fill="${fill}" stroke="${fill}">${dots.join("")}${links.join("")}</g>`;
}

/**
 * A square icon. `scale` is the mark's share of the width; `radius` rounds the
 * background (0 for platform icons, which the OS shapes itself); `bg` null
 * leaves it transparent.
 */
function svg({ size, scale, bg = PURPLE, fill = WHITE, radius = 0 }) {
  const m = size * scale;
  const off = (size - m) / 2;
  const back = bg
    ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${bg}"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${back}<g transform="translate(${off} ${off}) scale(${m / 108})">${mark(fill)}</g></svg>`;
}

const png = (s) => sharp(Buffer.from(s)).png({ compressionLevel: 9 });

/** A .ico holding PNG images (supported by every current browser). */
async function ico(sizes) {
  const images = await Promise.all(
    sizes.map((size) =>
      png(svg({ size, scale: 0.72, radius: size * 0.22 })).toBuffer(),
    ),
  );
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map((img, i) => {
    const e = Buffer.alloc(16);
    const size = sizes[i];
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(img.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += img.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images]);
}

await mkdir("public/icons", { recursive: true });

// Installable app (web app manifest). OS shapes these, so full-bleed squares.
await png(svg({ size: 192, scale: 0.56 })).toFile("public/icons/icon-192.png");
await png(svg({ size: 512, scale: 0.56 })).toFile("public/icons/icon-512.png");
// Maskable: Android may crop to a circle, so the mark stays in the safe zone.
await png(svg({ size: 512, scale: 0.46 })).toFile(
  "public/icons/maskable-512.png",
);
// Monochrome: Android themed icons tint this silhouette.
await png(svg({ size: 512, scale: 0.46, bg: null })).toFile(
  "public/icons/monochrome-512.png",
);

// iPhone home screen (iOS rounds the corners itself; no transparency).
await png(svg({ size: 180, scale: 0.56 })).toFile("src/app/apple-icon.png");

// Browser tab: a scalable icon plus a classic favicon.ico.
await writeFile(
  "src/app/icon.svg",
  svg({ size: 64, scale: 0.72, radius: 14 }) + "\n",
);
await writeFile("src/app/favicon.ico", await ico([16, 32, 48]));

console.log("App icons written.");
