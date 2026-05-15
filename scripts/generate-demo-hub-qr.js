#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const QRCode = require("qrcode");

const root = path.resolve(__dirname, "..");
const url = process.argv[2] || process.env.DEMO_HUB_URL || getDefaultDemoHubUrl();
const outputDir = path.join(root, "assets", "demo-data");
const publicDir = path.join(root, "apps", "studio", "public");
const svgPath = path.join(outputDir, "demo-hub-qr.svg");
const pngPath = path.join(outputDir, "demo-hub-qr.png");
const publicSvgPath = path.join(publicDir, "demo-hub-qr.svg");
const publicPngPath = path.join(publicDir, "demo-hub-qr.png");
const metaPath = path.join(outputDir, "demo-hub-qr.json");

const options = {
  errorCorrectionLevel: "H",
  margin: 2,
  width: 1200,
  color: {
    dark: "#031418",
    light: "#F8F3E7",
  },
};

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  await QRCode.toFile(svgPath, url, { ...options, type: "svg" });
  await QRCode.toFile(pngPath, url, options);
  fs.copyFileSync(svgPath, publicSvgPath);
  fs.copyFileSync(pngPath, publicPngPath);
  fs.writeFileSync(
    metaPath,
    `${JSON.stringify(
      {
        targetUrl: url,
        generatedAt: new Date().toISOString(),
        note: "Regenerate with `npm run qr:demo-hub -- https://your-deployed-url/demo-hub` before final deployment.",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`QR target: ${url}`);
  console.log(`Wrote ${path.relative(root, svgPath)}`);
  console.log(`Wrote ${path.relative(root, pngPath)}`);
  console.log(`Wrote ${path.relative(root, publicSvgPath)}`);
  console.log(`Wrote ${path.relative(root, publicPngPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

function getDefaultDemoHubUrl() {
  const interfaces = os.networkInterfaces();

  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses || []) {
      if (address.family === "IPv4" && !address.internal) {
        return `http://${address.address}:5173/demo-hub`;
      }
    }
  }

  return "http://127.0.0.1:5173/demo-hub";
}
