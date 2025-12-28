/* ==========================================
   HPLC UI + ANIMATION CONTROLLER (FIXED X AXIS)
   ========================================== */

let chart;
let timer = null;
let time = 0;
const MAX_TIME = 10;

let flowRate = 1.0;
let organicPercent = 40;
let sensitivity = 1.0;
let currentCompound = SAMPLES.caffeine;

let injecting = false;
let injectionTime = null;
let peakRT = null;
let peakWidth = 0.25;

/* DOM */
const statusEl = document.getElementById("status");
const pumpBtn = document.getElementById("pumpBtn");
const injectBtn = document.getElementById("injectBtn");
const rtDisplay = document.getElementById("rtDisplay");

const flowInput = document.getElementById("flowInput");
const organicInput = document.getElementById("organicInput");
const compoundSelect = document.getElementById("compoundSelect");
const sensitivityInput = document.getElementById("sensitivityInput");

/* Diagram */
let pumpBox, injectorBox, detectorLight, tubes;

/* ---------- GRAPH (FIXED) ---------- */
function initGraph() {
  const ctx = document.getElementById("graphCanvas").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [{
        label: "HPLC Chromatogram",
        data: [],
        borderColor: "#1565c0",
        borderWidth: 2,
        pointRadius: 0
      }]
    },
    options: {
      animation: false,
      responsive: true,
      parsing: false,              // 👈 IMPORTANT
      scales: {
        x: {
          type: "linear",           // 👈 THIS WAS MISSING
          min: 0,
          max: MAX_TIME,
          title: {
            display: true,
            text: "Time (min)"
          }
        },
        y: {
          min: -0.3,
          max: 3.0,
          title: {
            display: true,
            text: "Response (AU)"
          }
        }
      }
    }
  });
}

/* ---------- RT CALC ---------- */
function calculateRT() {
  const elutionStrength = 0.3 + (organicPercent / 100) * 0.7;
  return 1.0 + (currentCompound.hydrophobicity) / (flowRate * elutionStrength);
}

/* ---------- RUN LOOP ---------- */
function startRun() {
  stopRun();
  resetGraph();
  animateFlow(true);

  timer = setInterval(() => {
    time += 0.05;

    let signal = (Math.random() - 0.5) * 0.02 * sensitivity;

    if (injecting && time >= injectionTime) {
      signal += Math.exp(
        -Math.pow(time - peakRT, 2) /
        (2 * peakWidth * peakWidth)
      ) * sensitivity;

      detectorLight?.setAttribute("fill", "#ff5252");
    } else {
      detectorLight?.setAttribute("fill", "#999");
    }

    chart.data.datasets[0].data.push({
      x: time,      // 👈 TRUE TIME AXIS
      y: signal
    });

    chart.update("none");

    if (time >= MAX_TIME) stopRun();
  }, 100);
}

/* ---------- INJECT ---------- */
function injectSample() {
  resetGraph();
  injecting = true;
  injectionTime = 1.0;
  peakRT = calculateRT();

  rtDisplay.textContent = `Estimated RT: ${peakRT.toFixed(2)} min`;
  injectorBox?.classList.add("injectFlash");

  startRun();
}

/* ---------- HELPERS ---------- */
function resetGraph() {
  stopRun();
  time = 0;
  chart.data.datasets[0].data = [];
  chart.update();
}

function stopRun() {
  if (timer) clearInterval(timer);
  animateFlow(false);
}

/* ---------- DIAGRAM ---------- */
function animateFlow(on) {
  tubes?.forEach(t => t.classList.toggle("flow", on));
  pumpBox?.classList.toggle("pulse", on);
}

/* ---------- CONTROLS ---------- */
flowInput.oninput = () => flowRate = Number(flowInput.value);
organicInput.oninput = () => organicPercent = Number(organicInput.value);
compoundSelect.onchange = () => currentCompound = SAMPLES[compoundSelect.value];
sensitivityInput.oninput = () => sensitivity = Number(sensitivityInput.value);

/* ---------- BUTTONS ---------- */
pumpBtn.onclick = () => {
  const running = pumpBtn.textContent.includes("STOP");
  pumpBtn.textContent = running ? "Pump START" : "Pump STOP";
  injectBtn.disabled = running;
  running ? stopRun() : startRun();
};

injectBtn.onclick = injectSample;

/* ---------- SVG HOOK ---------- */
setTimeout(() => {
  pumpBox = document.getElementById("pumpBox");
  injectorBox = document.getElementById("injectorBox");
  detectorLight = document.getElementById("detectorLight");
  tubes = document.querySelectorAll(".tube");
}, 500);

/* ---------- START ---------- */
initGraph();