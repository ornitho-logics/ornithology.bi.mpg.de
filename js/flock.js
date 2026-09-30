const TAU = Math.PI * 2;

export const FLOCK_CONFIG = Object.freeze({
  birdCount: 200,
  smallViewportBirdCount: 36,
  smallViewportMax: 760,
  duration: 5000 ,
  entryStagger: 0.06,
  travelDurationRatioRange: [0.73, 0.8],
  progressVariation: 0.075,
  clusterProgressVariation: 0.045,
  clusterLateralVariation: 0.45,
  lateralVariation: 0.9,
  lateralAmplitudeRange: [5, 18],
  lateralFrequencyRange: [0.65, 1.15],
  formationSpread: 0.045,
  alpha: 0.8,
  rotationTriggerProgress: 0.5,
  palette: ["#edf0e4", "#dbe5d8", "#b9d0c3", "#f3f1e3"],
  sizeRange: [2.4, 4.6],
  wingbeatRange: [8, 15.5],
  rotationRampDuration: 100,
  maxDevicePixelRatio: 2
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
const randomBetween = (min, max) => min + Math.random() * (max - min);

function makeBird(index, clusterCount, clusterOffsets, clusterLateral, settings) {
  const depthBand = Math.floor(Math.random() * 3);
  const depth = [0.2, 0.55, 0.88][depthBand] + randomBetween(-0.06, 0.06);
  const cluster = index % clusterCount;

  return {
    delay: randomBetween(0, settings.duration * settings.entryStagger),
    travelDuration: randomBetween(
      settings.duration * settings.travelDurationRatioRange[0],
      settings.duration * settings.travelDurationRatioRange[1]
    ),
    progressOffset: randomBetween(-settings.progressVariation, settings.progressVariation) + clusterOffsets[cluster],
    lateralOffset: randomBetween(-settings.lateralVariation, settings.lateralVariation) + clusterLateral[cluster],
    lateralAmplitude: randomBetween(settings.lateralAmplitudeRange[0], settings.lateralAmplitudeRange[1]),
    lateralFrequency: randomBetween(settings.lateralFrequencyRange[0], settings.lateralFrequencyRange[1]),
    phase: randomBetween(0, TAU),
    wingPhase: randomBetween(0, TAU),
    wingPhaseOffset: randomBetween(0.25, 1.15),
    wingFrequency: randomBetween(settings.wingbeatRange[0], settings.wingbeatRange[1]),
    bankPhase: randomBetween(0, TAU),
    size: lerp(settings.sizeRange[0], settings.sizeRange[1], 0.25 + depth * 0.75),
    opacity: lerp(0.46, 0.9, depth),
    color: settings.palette[index % settings.palette.length]
  };
}

function traceCalidrisWing(context, side, flap, fold, bank) {
  const a = flap + side * bank;
  const projection = side * Math.cos(a) * 0.9 - Math.sin(a) * 0.436;
  const tipX = -0.7 - 0.18 * fold;
  const tipY = 2.65 - 0.48 * fold;

  context.save();
  context.transform(1, 0, -0.1 * Math.sin(a), projection, 0, 0);

  // Preserve path winding so overlapping parts form one silhouette.
  if (projection > 0) {
    context.moveTo(0.22, 0.12);
    context.bezierCurveTo(0.5, 0.44, 0.4, 0.9, 0.22, 1.16);
    context.bezierCurveTo(0, 1.72, -0.38, tipY - 0.28, tipX, tipY);
    context.bezierCurveTo(-0.64, tipY - 0.78, -0.78, 1.1, -0.7, 0.52);
    context.quadraticCurveTo(-0.58, 0.2, -0.35, 0.1);
  } else {
    context.moveTo(0.22, 0.12);
    context.lineTo(-0.35, 0.1);
    context.quadraticCurveTo(-0.58, 0.2, -0.7, 0.52);
    context.bezierCurveTo(-0.78, 1.1, -0.64, tipY - 0.78, tipX, tipY);
    context.bezierCurveTo(-0.38, tipY - 0.28, 0, 1.72, 0.22, 1.16);
    context.bezierCurveTo(0.4, 0.9, 0.5, 0.44, 0.22, 0.12);
  }

  context.closePath();
  context.restore();
}

function drawBird(context, bird, x, y, scale, angle, elapsed, flockAlpha) {
  const seconds = elapsed * 0.001;
  const cycle = (seconds * bird.wingFrequency + bird.wingPhase / TAU) % 1;

  const downstroke = cycle < 0.44;
  const stroke = downstroke
    ? cycle / 0.44
    : (cycle - 0.44) / 0.56;

  const flap = (downstroke ? 1 : -1)
    * 0.78
    * Math.cos(Math.PI * stroke);

  const fold = downstroke
  ? 0
  : Math.sin(Math.PI * stroke) ** 2;

  const bank = 0.12 * Math.sin(seconds * 1.3)
    + 0.04 * Math.sin(bird.bankPhase + seconds * 0.8);

  const billTip = 1.02 + (bird.billLength ?? 0.7);
  const billDrop = bird.billDrop ?? 0.1;

  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.scale(scale, scale);
  context.globalAlpha = bird.opacity * flockAlpha;
  context.fillStyle = bird.color;
  context.beginPath();

  traceCalidrisWing(context, -1, flap, fold, bank);
  traceCalidrisWing(context, 1, flap, fold, bank);

  // Short, gently rounded tail.
  context.moveTo(-0.65, -0.18);
  context.lineTo(-0.65, 0.18);
  context.lineTo(-1.24, 0.24);
  context.quadraticCurveTo(-1.38, 0, -1.24, -0.24);
  context.closePath();

  // Continuous body, short neck, and head.
  context.moveTo(-1, 0);
  context.bezierCurveTo(-0.78, -0.28, -0.15, -0.36, 0.23, -0.28);
  context.quadraticCurveTo(0.4, -0.23, 0.56, -0.18);
  context.bezierCurveTo(0.67, -0.34, 0.99, -0.29, 1.03, -0.1);
  context.quadraticCurveTo(1.14, 0.02, 1, 0.16);
  context.bezierCurveTo(0.86, 0.3, 0.62, 0.23, 0.54, 0.14);
  context.bezierCurveTo(0.18, 0.4, -0.6, 0.31, -1, 0);
  context.closePath();

  // Fine bill with a slight terminal droop.
  context.moveTo(0.98, -0.055);
  context.bezierCurveTo(
    1.24, -0.05,
    billTip - 0.16, billDrop * 0.3,
    billTip, billDrop
  );
  context.bezierCurveTo(
    billTip - 0.12, billDrop + 0.01,
    1.27, 0.08,
    0.98, 0.05
  );
  context.closePath();

  context.fill();
  context.restore();
}

function routeAt(progress, width, height, route) {
  const t = clamp(progress, 0, 1);
  const inverse = 1 - t;
  const startX = -0.18 * width;
  const startY = 1.16 * height;
  const control1X = 0.1 * width;
  const control1Y = 0.98 * height;
  const control2X = 0.65 * width;
  const control2Y = 0.2 * height;
  const endX = 1.18 * width;
  const endY = -0.18 * height;

  route.x =
    inverse * inverse * inverse * startX +
    3 * inverse * inverse * t * control1X +
    3 * inverse * t * t * control2X +
    t * t * t * endX;
  route.y =
    inverse * inverse * inverse * startY +
    3 * inverse * inverse * t * control1Y +
    3 * inverse * t * t * control2Y +
    t * t * t * endY;

  route.dx =
    3 * inverse * inverse * (control1X - startX) +
    6 * inverse * t * (control2X - control1X) +
    3 * t * t * (endX - control2X);
  route.dy =
    3 * inverse * inverse * (control1Y - startY) +
    6 * inverse * t * (control2Y - control1Y) +
    3 * t * t * (endY - control2Y);
}

function drawFlock(context, birds, width, height, elapsed, route, formationSpread, flockAlpha) {
  context.clearRect(0, 0, width, height);

  const flockSpread = Math.min(width, height) * formationSpread;
  const visibilityMargin = 90;

  for (const bird of birds) {
    const progress =
      (elapsed - bird.delay) / bird.travelDuration + bird.progressOffset;

    routeAt(progress, width, height, route);

    const tangentLength = Math.hypot(route.dx, route.dy) || 1;
    const tangentX = route.dx / tangentLength;
    const tangentY = route.dy / tangentLength;
    const lateral =
      bird.lateralOffset * flockSpread +
      Math.sin(
        bird.phase + elapsed * 0.001 * bird.lateralFrequency
      ) * bird.lateralAmplitude;
    const x = route.x - tangentY * lateral;
    const y = route.y + tangentX * lateral;

    if (
      x < -visibilityMargin ||
      x > width + visibilityMargin ||
      y < -visibilityMargin ||
      y > height + visibilityMargin
    ) {
      continue;
    }

    const bank = Math.sin(bird.bankPhase + elapsed * 0.001 * bird.lateralFrequency) * 0.055;
    drawBird(
      context,
      bird,
      x,
      y,
      bird.size,
      Math.atan2(route.dy, route.dx) + bank,
      elapsed,
      flockAlpha
    );
  }
}

/**
 * Start one flock intro. The promise always settles with a status object so
 * cancellation and rendering failures can be handled without rejecting page setup.
 */
export function startFlockIntro({ signal, config = {}, onPass } = {}) {
  const settings = { ...FLOCK_CONFIG, ...config };
  settings.palette = config.palette || FLOCK_CONFIG.palette;
  settings.sizeRange = config.sizeRange || FLOCK_CONFIG.sizeRange;
  settings.wingbeatRange = config.wingbeatRange || FLOCK_CONFIG.wingbeatRange;
  settings.alpha = clamp(settings.alpha, 0, 1);
  settings.rotationTriggerProgress = clamp(settings.rotationTriggerProgress, 0, 1);

  let resolveOutcome;
  let canvas = null;
  let context = null;
  let frameId = null;
  let status = "running";
  let lastFrameTime = 0;
  let elapsed = 0;
  let width = 0;
  let height = 0;
  let devicePixelRatio = 1;
  let passReported = false;
  let birds = [];
  const route = { x: 0, y: 0, dx: 0, dy: 0 };

  const promise = new Promise(resolve => {
    resolveOutcome = resolve;
  });

  const cleanup = () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }

    window.removeEventListener("resize", resizeCanvas);
    window.removeEventListener("orientationchange", resizeCanvas);
    window.visualViewport?.removeEventListener("resize", resizeCanvas);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    signal?.removeEventListener("abort", handleAbort);

    if (canvas?.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }

    canvas = null;
    context = null;
    birds = [];
  };

  const finish = (nextStatus, error) => {
    if (status !== "running") return;

    status = nextStatus;
    cleanup();
    resolveOutcome({ status: nextStatus, error });
  };

  const resizeCanvas = () => {
    if (!canvas || !context) return;

    width = window.innerWidth;
    height = window.innerHeight;
    devicePixelRatio = Math.min(settings.maxDevicePixelRatio, window.devicePixelRatio || 1);

    canvas.width = Math.max(1, Math.round(width * devicePixelRatio));
    canvas.height = Math.max(1, Math.round(height * devicePixelRatio));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  };

  const handleVisibilityChange = () => {
    // Accumulate only visible time, so returning to the tab cannot jump the flock ahead.
    lastFrameTime = 0;
  };

  const handleAbort = () => finish("cancelled");

  const frame = timestamp => {
    if (status !== "running") return;

    if (document.hidden) {
      lastFrameTime = 0;
      frameId = requestAnimationFrame(frame);
      return;
    }

    if (!lastFrameTime) lastFrameTime = timestamp;
    elapsed += Math.min(50, Math.max(0, timestamp - lastFrameTime));
    lastFrameTime = timestamp;

    drawFlock(
      context,
      birds,
      width,
      height,
      elapsed,
      route,
      settings.formationSpread,
      settings.alpha
    );

    if (!passReported && elapsed / settings.duration >= settings.rotationTriggerProgress) {
      passReported = true;
      onPass?.();
    }

    if (elapsed >= settings.duration) {
      finish("completed");
      return;
    }

    frameId = requestAnimationFrame(frame);
  };

  try {
    if (signal?.aborted) {
      finish("cancelled");
      return { promise, cancel: handleAbort };
    }

    canvas = document.createElement("canvas");
    canvas.className = "homepage-flock-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.tabIndex = -1;

    context = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!context) throw new Error("Canvas 2D is unavailable");

    (document.body || document.documentElement).appendChild(canvas);
    resizeCanvas();

    const count = width <= settings.smallViewportMax
      ? settings.smallViewportBirdCount
      : settings.birdCount;
    const clusterCount = Math.max(5, Math.round(count / 10));
    const clusterOffsets = [];
    const clusterLateral = [];

    for (let index = 0; index < clusterCount; index += 1) {
      clusterOffsets.push(randomBetween(-settings.clusterProgressVariation, settings.clusterProgressVariation));
      clusterLateral.push(randomBetween(-settings.clusterLateralVariation, settings.clusterLateralVariation));
    }

    birds = new Array(count);
    for (let index = 0; index < count; index += 1) {
      birds[index] = makeBird(index, clusterCount, clusterOffsets, clusterLateral, settings);
    }

    window.addEventListener("resize", resizeCanvas, { passive: true });
    window.addEventListener("orientationchange", resizeCanvas, { passive: true });
    window.visualViewport?.addEventListener("resize", resizeCanvas, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    signal?.addEventListener("abort", handleAbort, { once: true });

    frameId = requestAnimationFrame(frame);
  } catch (error) {
    finish("failed", error);
  }

  return {
    promise,
    cancel: handleAbort
  };
}
