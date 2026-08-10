const introScrolly = document.querySelector(".intro-scrolly");
const introCanvas = document.querySelector("#introCanvas");
const introFrameLabel = document.querySelector("#introFrameLabel");
const introContext = introCanvas ? introCanvas.getContext("2d") : null;
const introFrameCount = 480;
const introFrames = Array.from({ length: introFrameCount }, (_, index) => {
  const image = new Image();
  image.src = `assets/frames/frame_${String(index).padStart(4, "0")}.jpg`;
  return image;
});

let currentIntroFrame = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resizeIntroCanvas() {
  if (!introCanvas) return;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(window.innerWidth * ratio);
  const height = Math.round(window.innerHeight * ratio);

  if (introCanvas.width !== width || introCanvas.height !== height) {
    introCanvas.width = width;
    introCanvas.height = height;
  }
}

function drawIntroFrame() {
  if (!introCanvas || !introContext) return;

  const image = introFrames[currentIntroFrame];
  if (!image || !image.complete || !image.naturalWidth) return;

  resizeIntroCanvas();

  const canvasRatio = introCanvas.width / introCanvas.height;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  let drawWidth = introCanvas.width;
  let drawHeight = introCanvas.height;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > canvasRatio) {
    drawWidth = introCanvas.height * imageRatio;
    offsetX = (introCanvas.width - drawWidth) / 2;
  } else {
    drawHeight = introCanvas.width / imageRatio;
    offsetY = (introCanvas.height - drawHeight) / 2;
  }

  introContext.clearRect(0, 0, introCanvas.width, introCanvas.height);
  introContext.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function updateIntroSequence() {
  if (!introScrolly) return;

  const rect = introScrolly.getBoundingClientRect();
  const scrollable = rect.height - window.innerHeight;
  const amount = clamp(-rect.top / scrollable, 0, 1);
  const nextFrame = Math.min(
    introFrameCount - 1,
    Math.floor(amount * introFrameCount),
  );

  currentIntroFrame = nextFrame;
  document.documentElement.style.setProperty(
    "--intro-progress",
    amount.toFixed(4),
  );

  if (introFrameLabel) {
    introFrameLabel.textContent = `${String(nextFrame + 1).padStart(3, "0")} / ${introFrameCount}`;
  }

  drawIntroFrame();
}

window.addEventListener("scroll", updateIntroSequence, { passive: true });
window.addEventListener("resize", () => {
  resizeIntroCanvas();
  drawIntroFrame();
  updateIntroSequence();
});

introFrames[0].addEventListener("load", drawIntroFrame);
resizeIntroCanvas();
updateIntroSequence();
