// https://threejs.org/docs/#examples/en/controls/OrbitControls
// https://github.com/vasturiano/globe.gl/issues/8

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

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const world = Globe({
  rendererConfig: {
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  }
})(earthEl)
  .globeImageUrl(globe_path)
  .backgroundColor("rgba(0, 0, 0, 0)")

  // cleaner, less technical look
  .showGraticules(false)

  // softer atmosphere
  .showAtmosphere(true)
  .atmosphereColor("#9cc0b7")
  .atmosphereAltitude(0.18);

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

world.controls().autoRotate = !prefersReducedMotion;
world.controls().autoRotateSpeed = 0.45;
world.controls().maxDistance = 450;
world.controls().minDistance = 90;

world.controls().enableDamping = true;
world.controls().dampingFactor = 0.06;
world.controls().rotateSpeed = 0.45;
world.controls().zoomSpeed = 0.55;

for (const event of events) {
  window.addEventListener(event, () => {
    world.controls().autoRotate = false;
  });
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