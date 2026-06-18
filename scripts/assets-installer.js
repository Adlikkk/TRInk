#!/usr/bin/env node
// Generates NSIS installer assets from public/logo-bg.svg using sharp.
// Writes proper Windows DIB 24-bit BMPs to avoid NSIS warning 5040.
// Run via: pnpm assets:installer
import sharp from "sharp";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const logoPath = join(root, "public", "logo-bg.svg");
const outDir = join(root, "src-tauri", "installer-assets");

if (!existsSync(logoPath)) {
  console.error(`Logo not found: ${logoPath}`);
  process.exit(1);
}

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

const bg = { r: 2, g: 8, b: 23 };

async function writeDibBmp(inputPath, outputPath, width, height, background) {
  const { data, info } = await sharp(inputPath)
    .resize(width, height, { fit: "contain", background })
    .flatten({ background })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;

  // Row stride must be padded to a multiple of 4 bytes (Windows DIB requirement).
  const rowStride = Math.ceil((w * 3) / 4) * 4;
  const pixelDataSize = rowStride * h;
  const fileSize = 14 + 40 + pixelDataSize;

  const buf = Buffer.alloc(fileSize, 0);
  let o = 0;

  // BITMAPFILEHEADER (14 bytes)
  buf.write("BM", o, "ascii");             o += 2;
  buf.writeUInt32LE(fileSize, o);          o += 4;
  buf.writeUInt16LE(0, o);                 o += 2; // reserved1
  buf.writeUInt16LE(0, o);                 o += 2; // reserved2
  buf.writeUInt32LE(54, o);               o += 4; // pixel data offset

  // BITMAPINFOHEADER (40 bytes)
  buf.writeUInt32LE(40, o);               o += 4; // header size
  buf.writeInt32LE(w, o);                 o += 4; // width
  buf.writeInt32LE(h, o);                 o += 4; // height (positive = bottom-up)
  buf.writeUInt16LE(1, o);               o += 2; // color planes
  buf.writeUInt16LE(24, o);              o += 2; // bits per pixel
  buf.writeUInt32LE(0, o);               o += 4; // compression (BI_RGB = 0)
  buf.writeUInt32LE(pixelDataSize, o);    o += 4; // image size
  buf.writeInt32LE(2835, o);             o += 4; // X pixels per meter (~72 DPI)
  buf.writeInt32LE(2835, o);             o += 4; // Y pixels per meter (~72 DPI)
  buf.writeUInt32LE(0, o);               o += 4; // colors in table
  buf.writeUInt32LE(0, o);               o += 4; // important colors

  // Pixel data: BMP rows are bottom-up; pixels are stored in BGR order.
  const pixelBase = 54;
  for (let y = 0; y < h; y++) {
    // BMP row 0 = image bottom row (h-1).
    const imgRow = h - 1 - y;
    for (let x = 0; x < w; x++) {
      const src = (imgRow * w + x) * 3;
      const dst = pixelBase + y * rowStride + x * 3;
      buf[dst]     = data[src + 2]; // Blue
      buf[dst + 1] = data[src + 1]; // Green
      buf[dst + 2] = data[src];     // Red
    }
    // Padding bytes are already zero (Buffer.alloc initialises to 0).
  }

  writeFileSync(outputPath, buf);
}

// NSIS header BMP: 150×57
await writeDibBmp(logoPath, join(outDir, "nsis-header.bmp"), 150, 57, bg);

// NSIS sidebar BMP: 164×314
await writeDibBmp(logoPath, join(outDir, "nsis-sidebar.bmp"), 164, 314, bg);

console.log("Installer assets written to src-tauri/installer-assets/");
