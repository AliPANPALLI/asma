const frameCanvas = document.querySelector("#siteFrameBg");
const introFrameLabel = document.querySelector("#introFrameLabel");
const frameContext = frameCanvas ? frameCanvas.getContext("2d") : null;
const frameCount = 480;
const frames = Array.from({ length: frameCount }, (_, index) => {
  const image = new Image();
  image.src = `assets/frames/frame_${String(index).padStart(4, "0")}.jpg`;
  return image;
});

let currentFrame = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resizeFrameCanvas() {
  if (!frameCanvas) return;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(window.innerWidth * ratio);
  const height = Math.round(window.innerHeight * ratio);

  if (frameCanvas.width !== width || frameCanvas.height !== height) {
    frameCanvas.width = width;
    frameCanvas.height = height;
  }
}

function drawFrame() {
  if (!frameCanvas || !frameContext) return;

  const image = frames[currentFrame];
  if (!image || !image.complete || !image.naturalWidth) return;

  resizeFrameCanvas();

  const canvasRatio = frameCanvas.width / frameCanvas.height;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  let drawWidth = frameCanvas.width;
  let drawHeight = frameCanvas.height;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > canvasRatio) {
    drawWidth = frameCanvas.height * imageRatio;
    offsetX = (frameCanvas.width - drawWidth) / 2;
  } else {
    drawHeight = frameCanvas.width / imageRatio;
    offsetY = (frameCanvas.height - drawHeight) / 2;
  }

  frameContext.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
  frameContext.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function updateFrameSequence() {
  const maxScroll =
    document.documentElement.scrollHeight - window.innerHeight;
  const amount = maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;
  const nextFrame = Math.min(frameCount - 1, Math.floor(amount * frameCount));

  currentFrame = nextFrame;
  document.documentElement.style.setProperty(
    "--intro-progress",
    amount.toFixed(4),
  );

  if (introFrameLabel) {
    introFrameLabel.textContent = `${String(nextFrame + 1).padStart(3, "0")} / ${frameCount}`;
  }

  drawFrame();
}

window.addEventListener("scroll", updateFrameSequence, { passive: true });
window.addEventListener("resize", () => {
  resizeFrameCanvas();
  drawFrame();
  updateFrameSequence();
});

frames[0].addEventListener("load", drawFrame);
resizeFrameCanvas();
updateFrameSequence();
