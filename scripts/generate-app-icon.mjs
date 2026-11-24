import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "apps/desktop/src-tauri/icons/icon.ico");
const size = 64;
const scale = 4;
const sampleSize = size * scale;

function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function roundedRect(x, y, left, top, right, bottom, radius) {
  const cx = Math.max(left + radius, Math.min(x, right - radius));
  const cy = Math.max(top + radius, Math.min(y, bottom - radius));
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function pixel(x, y) {
  const cx = x + 0.5;
  const cy = y + 0.5;
  const center = sampleSize / 2;
  const bg = roundedRect(cx, cy, 8 * scale, 5 * scale, 56 * scale, 59 * scale, 13 * scale);
  if (!bg) return [0, 0, 0, 0];

  const shield = [
    [center, 12 * scale],
    [43 * scale, 17 * scale],
    [42 * scale, 34 * scale],
    [center, 49 * scale],
    [22 * scale, 34 * scale],
    [21 * scale, 17 * scale],
  ];
  if (insidePolygon(cx, cy, shield)) return [105, 204, 157, 255];

  const outerRadius = 10 * scale;
  const innerRadius = 8.3 * scale;
  const dx = cx - center;
  const dy = cy - center;
  const radius = Math.sqrt(dx * dx + dy * dy);
  const inRing = radius > innerRadius && radius < outerRadius;
  const cross = (Math.abs(dx) < 1.2 * scale && Math.abs(dy) < 15 * scale)
    || (Math.abs(dy) < 1.2 * scale && Math.abs(dx) < 15 * scale);
  if (inRing || cross) return [225, 239, 230, 255];
  return [23, 34, 34, 255];
}

const rgba = Buffer.alloc(sampleSize * sampleSize * 4);
for (let y = 0; y < sampleSize; y++) {
  for (let x = 0; x < sampleSize; x++) {
    const offset = (y * sampleSize + x) * 4;
    rgba.set(pixel(x, y), offset);
  }
}

const pixels = Buffer.alloc(size * size * 4);
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const sum = [0, 0, 0, 0];
    for (let sy = 0; sy < scale; sy++) {
      for (let sx = 0; sx < scale; sx++) {
        const offset = (((y * scale + sy) * sampleSize) + (x * scale + sx)) * 4;
        for (let channel = 0; channel < 4; channel++) sum[channel] += rgba[offset + channel];
      }
    }
    const outputOffset = (y * size + x) * 4;
    pixels[outputOffset] = Math.round(sum[2] / (scale * scale));
    pixels[outputOffset + 1] = Math.round(sum[1] / (scale * scale));
    pixels[outputOffset + 2] = Math.round(sum[0] / (scale * scale));
    pixels[outputOffset + 3] = Math.round(sum[3] / (scale * scale));
  }
}

const rowBytes = size * 4;
const maskRowBytes = Math.ceil(size / 32) * 4;
const mask = Buffer.alloc(maskRowBytes * size);
const dib = Buffer.alloc(40 + pixels.length + mask.length);
dib.writeUInt32LE(40, 0);
dib.writeInt32LE(size, 4);
dib.writeInt32LE(size * 2, 8);
dib.writeUInt16LE(1, 12);
dib.writeUInt16LE(32, 14);
dib.writeUInt32LE(0, 16);
dib.writeUInt32LE(pixels.length, 20);
dib.writeInt32LE(2835, 24);
dib.writeInt32LE(2835, 28);
dib.writeUInt32LE(0, 32);
dib.writeUInt32LE(0, 36);

for (let y = 0; y < size; y++) {
  const sourceY = size - 1 - y;
  const sourceStart = sourceY * rowBytes;
  pixels.copy(dib, 40 + y * rowBytes, sourceStart, sourceStart + rowBytes);
}
mask.copy(dib, 40 + pixels.length);

const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt8(size, 6);
header.writeUInt8(size, 7);
header.writeUInt8(0, 8);
header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(dib.length, 14);
header.writeUInt32LE(header.length, 18);

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, Buffer.concat([header, dib]));
console.log(`Created ${path.relative(root, output)}`);
