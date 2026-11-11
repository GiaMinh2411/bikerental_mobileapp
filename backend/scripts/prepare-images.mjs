import sharp from "sharp";
import fs from "node:fs/promises";
const manifest = JSON.parse(
  await fs.readFile(new URL("./image-inputs.json", import.meta.url), "utf8"),
);
await fs.mkdir("media", { recursive: true });
const tiles = [];
for (const { id, path } of manifest.images) {
  if (!path) throw new Error(`Missing generated image ${id}`);
  await sharp(path)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(`media/bike-${id}.webp`);
  await sharp(path)
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 76 })
    .toFile(`media/bike-${id}-thumb.webp`);
  const tile = await sharp(path)
    .resize(240, 160, { fit: "contain", background: "#ffffff" })
    .png()
    .toBuffer();
  tiles.push({
    input: tile,
    left: ((id - 1) % 4) * 240,
    top: Math.floor((id - 1) / 4) * 180,
  });
}
await sharp({
  create: { width: 960, height: 1080, channels: 3, background: "#dce8e0" },
})
  .composite(tiles)
  .png()
  .toFile("media/contact-sheet.png");
console.log("24 main photographs and 24 thumbnails saved to backend/media.");
