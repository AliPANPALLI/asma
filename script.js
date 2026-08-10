const scrolly = document.querySelector(".scrolly");
const introScrolly = document.querySelector(".intro-scrolly");
const film = document.querySelector("#film");
const progress = document.querySelector("#progress");
const storyVideo = document.querySelector("#storyVideo");
const frameLabel = document.querySelector("#frameLabel");
const introCanvas = document.querySelector("#introCanvas");
const introFrameLabel = document.querySelector("#introFrameLabel");
const introContext = introCanvas ? introCanvas.getContext("2d") : null;
const introFrameCount = 120;
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

function drawVideoFrame() {
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

function updateScrollScene() {
  if (introScrolly) {
    const introRect = introScrolly.getBoundingClientRect();
    const introScrollable = introRect.height - window.innerHeight;
    const introAmount = clamp(-introRect.top / introScrollable, 0, 1);

    document.documentElement.style.setProperty(
      "--intro-progress",
      introAmount.toFixed(4),
    );

    currentIntroFrame = Math.min(
      introFrameCount - 1,
      Math.floor(introAmount * introFrameCount),
    );
    drawVideoFrame();

    if (introFrameLabel) {
      introFrameLabel.textContent = `${String(Math.round(introAmount * 100)).padStart(2, "0")}%`;
    }
  }

  if (!scrolly || !film || !progress) return;

  const rect = scrolly.getBoundingClientRect();
  const scrollable = rect.height - window.innerHeight;
  const amount = clamp(-rect.top / scrollable, 0, 1);
  const filmWidth = film.scrollWidth;
  const viewport = window.innerWidth;
  const start = viewport < 640 ? viewport * 0.02 : viewport * 0.08;
  const end = Math.min(0, viewport - filmWidth - viewport * 0.08);
  const x = start + (end - start) * amount;

  document.documentElement.style.setProperty("--film-x", `${x}px`);
  document.documentElement.style.setProperty("--progress", amount.toFixed(4));

  if (storyVideo && Number.isFinite(storyVideo.duration)) {
    const targetTime = storyVideo.duration * amount;
    if (Math.abs(storyVideo.currentTime - targetTime) > 0.04) {
      storyVideo.currentTime = targetTime;
    }
  }

  if (frameLabel) {
    frameLabel.textContent = `${String(Math.round(amount * 100)).padStart(2, "0")}%`;
  }
}

window.addEventListener("scroll", updateScrollScene, { passive: true });
window.addEventListener("resize", () => {
  resizeIntroCanvas();
  drawVideoFrame();
  updateScrollScene();
});
if (storyVideo) {
  storyVideo.addEventListener("loadedmetadata", updateScrollScene);
  storyVideo.addEventListener("canplay", updateScrollScene);
}
introFrames[0].addEventListener("load", drawVideoFrame);
resizeIntroCanvas();
updateScrollScene();
