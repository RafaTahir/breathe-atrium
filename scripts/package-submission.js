#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");
const outputDir = path.join(root, "submission-package");

const expectedArtifacts = [
  "apps/studio/dist",
  "docs/pitch",
  "docs/business",
  "docs/prototype",
  "docs/validation",
  "docs/qna",
  "docs/architecture",
  "firmware/esp32-sensor-stream",
  "assets/backgrounds",
  "assets/logos",
  "assets/demo-data",
];

const manifest = {
  project: "BreatheAtrium",
  status: "submission packaging manifest",
  generatedAt: new Date().toISOString(),
  dryRun,
  expectedArtifacts: expectedArtifacts.map((relativePath) => {
    const absolutePath = path.join(root, relativePath);
    return {
      path: relativePath,
      exists: fs.existsSync(absolutePath),
    };
  }),
  todo: [
    "Copy final pitch deck PDF/PPTX into the package.",
    "Copy final studio build after npm run build.",
    "Copy final screenshots and demo video.",
    "Add signed IP/licensing note if available.",
    "Add measured pilot report only after real pilot data exists.",
  ],
};

if (dryRun) {
  console.log(JSON.stringify(manifest, null, 2));
  process.exit(0);
}

fs.mkdirSync(outputDir, { recursive: true });
const manifestPath = path.join(outputDir, "manifest.json");
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`Wrote ${path.relative(root, path.join(outputDir, "manifest.json"))}`);

const archivePath = path.join(outputDir, "breathe-atrium-submission.zip");
const zipSources = [
  path.relative(root, manifestPath),
  ...expectedArtifacts.filter((relativePath) => fs.existsSync(path.join(root, relativePath))),
];

const archived = createZipArchive(zipSources, archivePath);

if (archived) {
  console.log(`Wrote ${path.relative(root, archivePath)}`);
} else {
  console.log("ZIP archive was not created because no supported local zip tool was found.");
}

console.log("Add final deck files, screenshots, and measured pilot reports only when they exist.");

function createZipArchive(relativeSources, destination) {
  if (process.platform === "win32") {
    const psArray = relativeSources.map((source) => `'${source.replace(/'/g, "''")}'`).join(",");
    const psDestination = path.relative(root, destination).replace(/'/g, "''");
    const command = [
      "$ErrorActionPreference = 'Stop'",
      `$paths = @(${psArray}) | Where-Object { Test-Path $_ }`,
      `if ($paths.Count -eq 0) { throw 'No package sources found.' }`,
      `Compress-Archive -Path $paths -DestinationPath '${psDestination}' -Force`,
    ].join("; ");

    const result = spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command], {
      cwd: root,
      stdio: "inherit",
    });

    return result.status === 0 && fs.existsSync(destination);
  }

  const result = spawnSync("zip", ["-r", destination, ...relativeSources], {
    cwd: root,
    stdio: "inherit",
  });

  return result.status === 0 && fs.existsSync(destination);
}
