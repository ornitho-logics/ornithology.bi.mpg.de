// https://threejs.org/docs/#examples/en/controls/OrbitControls
// https://github.com/vasturiano/globe.gl/issues/8

import { FLOCK_CONFIG, startFlockIntro } from "./flock.js?v=2026-09-30";

const globe_path = "./CONTENT/main/basemap.png";
const sites_path = "./CONTENT/data/study_sites.csv";

const map_center = { lat: 40, lng: -65, altitude: 1.75 };

const study_sites = ([site, species, lat, lng, url, size, color]) => ({
  site,
  species,
  lat: +lat,
  lng: +lng,
  url,
  size: +size,
  color
});

const events = ["click", "touchstart", "mousedown", "wheel"];

const ringsCols = [
  "rgba(179, 140, 180, 0.55)",
  "rgba(183, 145, 140, 0.45)",
  "rgba(197, 164, 138, 0.35)"
];

const dotColor = "rgba(230, 97, 25, 0.9)";
const earthEl = document.getElementById("Earth");

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const initialReducedMotion = motionQuery.matches;
let reducedMotion = initialReducedMotion;
let globeReady = false;
let flockPassed = initialReducedMotion;
let flockCancelled = false;
let hasUserInteracted = false;
let rotationSuppressed = initialReducedMotion;
let rotationStarted = false;
let rotationRampFrame = null;
let flockHandle = null;

function stopAutomaticRotation() {
  if (rotationRampFrame !== null) {
    cancelAnimationFrame(rotationRampFrame);
    rotationRampFrame = null;
  }

  world.controls().autoRotate = false;
}

function handleUserInteraction() {
  if (!hasUserInteracted) {
    hasUserInteracted = true;
    flockHandle?.cancel();
  }

  stopAutomaticRotation();
}

function maybeStartAutomaticRotation() {
  if (
    rotationStarted ||
    !globeReady ||
    !flockPassed ||
    flockCancelled ||
    reducedMotion ||
    rotationSuppressed ||
    hasUserInteracted
  ) {
    return;
  }

  rotationStarted = true;
  const controls = world.controls();
  const rampStart = performance.now();
  const targetSpeed = 0.45;

  controls.autoRotateSpeed = 0;
  controls.autoRotate = true;

  const ramp = timestamp => {
    if (reducedMotion || rotationSuppressed || hasUserInteracted) {
      controls.autoRotate = false;
      rotationRampFrame = null;
      return;
    }

    const progress = Math.min(
      1,
      (timestamp - rampStart) / FLOCK_CONFIG.rotationRampDuration
    );
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    controls.autoRotateSpeed = targetSpeed * easedProgress;

    if (progress < 1) {
      rotationRampFrame = requestAnimationFrame(ramp);
    } else {
      controls.autoRotateSpeed = targetSpeed;
      rotationRampFrame = null;
    }
  };

  rotationRampFrame = requestAnimationFrame(ramp);
}

function handleGlobeReady() {
  globeReady = true;
  maybeStartAutomaticRotation();
}

function handleMotionPreferenceChange(event) {
  reducedMotion = event.matches;

  if (reducedMotion) {
    rotationSuppressed = true;
    flockHandle?.cancel();
    stopAutomaticRotation();
  }
}

const world = Globe({
  rendererConfig: {
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  },
  animateIn: false,
  waitForGlobeReady: true
})(earthEl)
  .globeImageUrl(globe_path)
  .backgroundColor("rgba(0, 0, 0, 0)")

  // cleaner, less technical look
  .showGraticules(false)

  // softer atmosphere
  .showAtmosphere(true)
  .atmosphereColor("#9cc0b7")
  .atmosphereAltitude(0.18)
  .onGlobeReady(handleGlobeReady);

function resizeGlobe() {
  const { width, height } = earthEl.getBoundingClientRect();

  if (width <= 0 || height <= 0) return;

  world.width(Math.round(width));
  world.height(Math.round(height));
}

resizeGlobe();

requestAnimationFrame(() => {
  resizeGlobe();
  world.pointOfView(map_center, 0);
});

new ResizeObserver(() => {
  resizeGlobe();
}).observe(earthEl);

window.addEventListener("resize", resizeGlobe);

world.controls().autoRotate = false;
world.controls().autoRotateSpeed = 0.45;
world.controls().maxDistance = 450;
world.controls().minDistance = 90;

world.controls().enableDamping = true;
world.controls().dampingFactor = 0.06;
world.controls().rotateSpeed = 0.45;
world.controls().zoomSpeed = 0.55;

for (const event of events) {
  window.addEventListener(event, handleUserInteraction, { passive: true });
}

if (typeof motionQuery.addEventListener === "function") {
  motionQuery.addEventListener("change", handleMotionPreferenceChange);
} else {
  motionQuery.addListener(handleMotionPreferenceChange);
}

if (!initialReducedMotion) {
  const flockController = new AbortController();
  flockHandle = startFlockIntro({
    signal: flockController.signal,
    onPass: () => {
      flockPassed = true;
      maybeStartAutomaticRotation();
    }
  });

  flockHandle.promise.then(outcome => {
    flockCancelled = outcome.status === "cancelled";
    if (outcome.status === "failed") {
      flockPassed = true;
    }
    flockHandle = null;
    maybeStartAutomaticRotation();
  });
} else {
  flockPassed = true;
}

Promise.all([
  fetch(sites_path)
    .then(res => res.text())
    .then(d => d3.csvParseRows(d, study_sites))
]).then(([study_sites]) => {
  world
    .ringsData(study_sites)
    .ringMaxRadius(1.8)
    .ringRepeatPeriod(1200)
    .ringPropagationSpeed(0.45)
    .ringColor(() => ringsCols)

    .labelsData(study_sites)
    .labelColor(() => dotColor)
    .labelText(d => d.site)
    .labelLabel(d => `<strong>${d.site}</strong><br>${d.species}`)
    .labelResolution(4)
    .labelSize(0.15)
    .labelDotRadius(d => d.size ? Math.max(+d.size, 1.1) : 1.1)
    .labelAltitude(0.012)
    .labelRotation(0)
    .labelsTransitionDuration(250)

    .onLabelHover(d => {
      earthEl.style.cursor = d ? "pointer" : "move";
    })

    .onLabelClick(d => {
      $.get(d.url + "about.md", about_text => {
        bootbox.confirm({
          animate: true,
          size: "large",
          centerVertical: true,
          message: marked.parse(about_text),
          backdrop: true,
          closeButton: false,

          onShow: function() {
            $("#intro_start").hide();
            $("#dude").css("opacity", "0.05");
            $("#Earth").css("opacity", "0.05");
          },

          onHide: function() {
            $("#intro_start").show();
            $("#dude").css("opacity", "1");
            $("#Earth").css("opacity", "1");
          },

          buttons: {
            confirm: {
              label: "More about this ...",
              className: "btn btn-primary btn-sm"
            },
            cancel: {
              label: "Back",
              className: "btn btn-secondary btn-sm"
            }
          },

          callback: function(result) {
            if (result) {
              window.location.href = d.url;
            }
          }
        });
      });
    });
});
