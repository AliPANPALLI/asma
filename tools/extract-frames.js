import { createServer } from "node:http";
import { createWriteStream, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const framesDir = join(root, "assets", "frames");
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const frameCount = 120;

mkdirSync(framesDir, { recursive: true });

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mp4": "video/mp4",
};

function sendFile(req, res, filePath) {
  const stats = statSync(filePath);
  const range = req.headers.range;
  const contentType = mime[extname(filePath)] || "application/octet-stream";

  if (range) {
    const [startText, endText] = range.replace("bytes=", "").split("-");
    const start = Number(startText);
    const end = endText ? Number(endText) : stats.size - 1;
    res.writeHead(206, {
      "Content-Type": contentType,
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${stats.size}`,
      "Accept-Ranges": "bytes",
    });
    createWriteStream;
    import("node:fs").then(({ createReadStream }) => {
      createReadStream(filePath, { start, end }).pipe(res);
    });
    return;
  }

  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": stats.size,
    "Accept-Ranges": "bytes",
  });
  res.end(readFileSync(filePath));
}

function capturePage() {
  return `<!doctype html>
<html>
<body>
<video id="video" src="/assets/koy-urunleri-video.mp4" muted playsinline preload="auto"></video>
<canvas id="canvas" width="1280" height="720"></canvas>
<script>
const video = document.querySelector("#video");
const canvas = document.querySelector("#canvas");
const context = canvas.getContext("2d");
const count = ${frameCount};

function wait(event) {
  return new Promise((resolve) => {
    const done = () => {
      video.removeEventListener(event, done);
      resolve();
    };
    video.addEventListener(event, done);
  });
}

async function seek(time) {
  video.currentTime = Math.min(time, Math.max(0, video.duration - 0.04));
  await wait("seeked");
}

async function sendFrame(index, blob) {
  const response = await fetch("/frame?index=" + String(index).padStart(4, "0"), {
    method: "POST",
    headers: { "Content-Type": "image/jpeg" },
    body: blob,
  });
  if (!response.ok) throw new Error("Frame upload failed " + index);
}

function drawCover() {
  const canvasRatio = canvas.width / canvas.height;
  const videoRatio = video.videoWidth / video.videoHeight;
  let width = canvas.width;
  let height = canvas.height;
  let x = 0;
  let y = 0;

  if (videoRatio > canvasRatio) {
    width = canvas.height * videoRatio;
    x = (canvas.width - width) / 2;
  } else {
    height = canvas.width / videoRatio;
    y = (canvas.height - height) / 2;
  }

  context.drawImage(video, x, y, width, height);
}

async function run() {
  await wait("loadedmetadata");
  await wait("loadeddata");
  for (let index = 0; index < count; index += 1) {
    const time = (video.duration * index) / (count - 1);
    await seek(time);
    drawCover();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    await sendFrame(index, blob);
  }
  await fetch("/done", { method: "POST" });
}

run().catch(async (error) => {
  await fetch("/error", { method: "POST", body: String(error.stack || error) });
});
</script>
</body>
</html>`;
}

let saved = 0;
let done;
const complete = new Promise((resolvePromise, rejectPromise) => {
  done = { resolve: resolvePromise, reject: rejectPromise };
});

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");

  if (url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(capturePage());
    return;
  }

  if (url.pathname === "/frame" && req.method === "POST") {
    const index = url.searchParams.get("index") || String(saved).padStart(4, "0");
    const output = createWriteStream(join(framesDir, `frame_${index}.jpg`));
    req.pipe(output);
    output.on("finish", () => {
      saved += 1;
      res.writeHead(204);
      res.end();
    });
    return;
  }

  if (url.pathname === "/done" && req.method === "POST") {
    res.writeHead(204);
    res.end();
    done.resolve();
    return;
  }

  if (url.pathname === "/error" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      res.writeHead(204);
      res.end();
      done.reject(new Error(body));
    });
    return;
  }

  const filePath = join(root, decodeURIComponent(url.pathname));
  if (existsSync(filePath) && filePath.startsWith(root)) {
    sendFile(req, res, filePath);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(42731, "127.0.0.1", async () => {
  const browser = spawn(edgePath, [
    "--headless=new",
    "--disable-gpu",
    "--autoplay-policy=no-user-gesture-required",
    "--user-data-dir=" + join(root, ".edge-frame-capture"),
    "http://127.0.0.1:42731/",
  ]);

  try {
    await complete;
    browser.kill();
    server.close();
    console.log(`Saved ${saved} frames to ${framesDir}`);
  } catch (error) {
    browser.kill();
    server.close();
    console.error(error);
    process.exitCode = 1;
  }
});
