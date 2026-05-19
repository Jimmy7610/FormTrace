import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgContent = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1024" height="1024" rx="200" ry="200" fill="#6366f1" />
  
  <!-- Text -->
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="500" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="central">
    FT
  </text>
  
  <!-- Diagnostic element (magnifying glass / crosshair) -->
  <circle cx="800" cy="800" r="120" fill="none" stroke="#a78bfa" stroke-width="40" />
  <line x1="720" y1="800" x2="880" y2="800" stroke="#a78bfa" stroke-width="40" />
  <line x1="800" y1="720" x2="800" y2="880" stroke="#a78bfa" stroke-width="40" />
</svg>
`;

async function generateIcons() {
  const sizes = [16, 32, 48, 128];
  const outDir = path.join(process.cwd(), 'public', 'icon');
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const size of sizes) {
    const outPath = path.join(outDir, `${size}.png`);
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${outPath}`);
  }
}

generateIcons().catch(err => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
