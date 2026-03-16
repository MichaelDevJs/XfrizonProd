const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const WATCH_DIRS = ["src", "public"];
const WATCH_FILES = ["index.html", "vite.config.js", ".env", ".env.local"];

let timer = null;
let isRunning = false;
let queued = false;

function runBuildSync() {
  if (isRunning) {
    queued = true;
    return;
  }

  isRunning = true;
  console.log("[watch-sync] Running build:sync...");

  const cmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const child = spawn(cmd, ["run", "build:sync"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: false,
  });

  child.on("close", (code) => {
    isRunning = false;
    if (code === 0) {
      console.log("[watch-sync] build:sync completed.");
    } else {
      console.error(`[watch-sync] build:sync failed with code ${code}.`);
    }

    if (queued) {
      queued = false;
      runBuildSync();
    }
  });
}

function scheduleBuild() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    runBuildSync();
  }, 450);
}

function watchDirectory(relDir) {
  const absDir = path.join(ROOT, relDir);
  if (!fs.existsSync(absDir)) return;

  fs.watch(absDir, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    if (filename.includes("node_modules") || filename.includes("dist")) return;
    scheduleBuild();
  });
}

function watchFile(relFile) {
  const absPath = path.join(ROOT, relFile);
  if (!fs.existsSync(absPath)) return;

  fs.watch(absPath, () => {
    scheduleBuild();
  });
}

for (const dir of WATCH_DIRS) watchDirectory(dir);
for (const file of WATCH_FILES) watchFile(file);

console.log("[watch-sync] Watching frontend files for backend sync...");
runBuildSync();
