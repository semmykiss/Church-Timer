import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer: width * 4 bytes per row + 1 filter byte (0) per row
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter byte: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    // calculate crc
    const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
    buf.writeUInt32BE(crc >>> 0, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ 0xffffffff;
}

// Church Timer Icon Art: Deep sanctuary background (#0f172a), glowing emerald (#10b981) ring & golden cross
function drawChurchIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const radius = w * 0.42;

  // Background
  if (!isMaskable && dist > radius) {
    return [0, 0, 0, 0]; // Transparent outside circle for normal icons
  }

  // Rounded squircle / dark background
  const bgR = 15, bgG = 23, bgB = 42; // #0f172a

  // Outer ring (countdown ring indicator)
  const ringInner = radius * 0.78;
  const ringOuter = radius * 0.92;
  if (dist >= ringInner && dist <= ringOuter) {
    // Emerald green (#10b981)
    return [16, 185, 129, 255];
  }

  // Golden Latin Cross in center
  // Vertical beam: cx - w*0.04 to cx + w*0.04, cy - h*0.28 to cy + h*0.28
  // Horizontal beam: cx - w*0.20 to cx + w*0.20, cy - h*0.14 to cy - h*0.06
  const vertHalfW = w * 0.045;
  const horizHalfW = w * 0.20;
  const beamTop = cy - h * 0.28;
  const beamBottom = cy + h * 0.28;
  const crossbarTop = cy - h * 0.14;
  const crossbarBottom = cy - h * 0.05;

  const inVertBeam = Math.abs(x - cx) <= vertHalfW && y >= beamTop && y <= beamBottom;
  const inHorizBeam = Math.abs(x - cx) <= horizHalfW && y >= crossbarTop && y <= crossbarBottom;

  if (inVertBeam || inHorizBeam) {
    // Radiant Amber Gold (#fbbf24)
    return [251, 191, 36, 255];
  }

  // Subtle clock tick marks at 12, 3, 6, 9
  const is12 = Math.abs(x - cx) <= 2 && y >= cy - radius * 0.75 && y <= cy - radius * 0.65;
  const is6 = Math.abs(x - cx) <= 2 && y >= cy + radius * 0.65 && y <= cy + radius * 0.75;
  const is3 = Math.abs(y - cy) <= 2 && x >= cx + radius * 0.65 && x <= cx + radius * 0.75;
  const is9 = Math.abs(y - cy) <= 2 && x >= cx - radius * 0.75 && x <= cx - radius * 0.65;
  if (is12 || is6 || is3 || is9) {
    return [52, 211, 153, 200];
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, (x, y, w, h) => drawChurchIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawChurchIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, (x, y, w, h) => drawChurchIcon(x, y, w, h, true)));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawChurchIcon(x, y, w, h, true)));

// Also create public/icon.svg
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="128" fill="#0f172a"/>
  <!-- Circular Progress Ring -->
  <circle cx="256" cy="256" r="180" stroke="#10b981" stroke-width="24" stroke-dasharray="1000 130" stroke-linecap="round"/>
  <!-- Clock Ticks -->
  <circle cx="256" cy="90" r="8" fill="#34d399"/>
  <circle cx="422" cy="256" r="8" fill="#34d399"/>
  <circle cx="256" cy="422" r="8" fill="#34d399"/>
  <circle cx="90" cy="256" r="8" fill="#34d399"/>
  <!-- Cross in Center -->
  <rect x="236" y="130" width="40" height="252" rx="8" fill="#fbbf24"/>
  <rect x="156" y="200" width="200" height="40" rx="8" fill="#fbbf24"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSvg);

console.log('Successfully generated all PWA icons in /public: 192x192, 512x512, maskable, apple-touch-icon, and icon.svg');
