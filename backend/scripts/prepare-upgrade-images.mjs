import sharp from "sharp";
import fs from "node:fs/promises";
const inputs = JSON.parse(
  await fs.readFile(
    new URL("./upgrade-image-inputs.json", import.meta.url),
    "utf8",
  ),
);
for (const { id, path } of inputs) {
  if (!path) throw new Error("Missing generated image " + id);
  await sharp(path)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(`media/bike-${id}.webp`);
  await sharp(path)
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 76 })
    .toFile(`media/bike-${id}-thumb.webp`);
}
const tiles = [];
for (let id = 1; id <= 60; id++) {
  const image = await sharp(`media/bike-${id}.webp`)
    .resize(220, 147, { fit: "contain", background: "#ffffff" })
    .png()
    .toBuffer();
  tiles.push({
    input: image,
    left: ((id - 1) % 6) * 220,
    top: Math.floor((id - 1) / 6) * 160,
  });
}
await sharp({
  create: { width: 1320, height: 1600, channels: 3, background: "#dce8e0" },
})
  .composite(tiles)
  .png()
  .toFile("media/contact-sheet-60.png");
console.log("60 main images and 60 thumbnails ready.");
