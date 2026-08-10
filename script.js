const scrolly = document.querySelector(".scrolly");
const introScrolly = document.querySelector(".intro-scrolly");
const film = document.querySelector("#film");
const progress = document.querySelector("#progress");
const storyVideo = document.querySelector("#storyVideo");
const frameLabel = document.querySelector("#frameLabel");
const introVideo = document.querySelector("#introVideo");
const introCanvas = document.querySelector("#introCanvas");
const introFrameLabel = document.querySelector("#introFrameLabel");
const introContext = introCanvas ? introCanvas.getContext("2d") : null;

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
  if (!introVideo || !introCanvas || !introContext) return;
  if (!introVideo.videoWidth || !introVideo.videoHeight) return;

  resizeIntroCanvas();

  const canvasRatio = introCanvas.width / introCanvas.height;
  const videoRatio = introVideo.videoWidth / introVideo.videoHeight;
  let drawWidth = introCanvas.width;
  let drawHeight = introCanvas.height;
  let offsetX = 0;
  let offsetY = 0;

  if (videoRatio > canvasRatio) {
    drawWidth = introCanvas.height * videoRatio;
    offsetX = (introCanvas.width - drawWidth) / 2;
  } else {
    drawHeight = introCanvas.width / videoRatio;
    offsetY = (introCanvas.height - drawHeight) / 2;
  }

  introContext.drawImage(introVideo, offsetX, offsetY, drawWidth, drawHeight);
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

    if (introVideo && Number.isFinite(introVideo.duration)) {
      const introTargetTime = introVideo.duration * introAmount;
      if (Math.abs(introVideo.currentTime - introTargetTime) > 0.04) {
        introVideo.currentTime = introTargetTime;
      } else {
        drawVideoFrame();
      }
    }

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
if (introVideo) {
  introVideo.addEventListener("loadedmetadata", () => {
    resizeIntroCanvas();
    updateScrollScene();
  });
  introVideo.addEventListener("loadeddata", drawVideoFrame);
  introVideo.addEventListener("seeked", drawVideoFrame);
  introVideo.addEventListener("canplay", () => {
    drawVideoFrame();
    updateScrollScene();
  });
}
resizeIntroCanvas();
updateScrollScene();
