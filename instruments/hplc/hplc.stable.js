/* ==================================================
   HPLC SIMULATOR – ENHANCED DIAGRAM ANIMATION
   ================================================== */

let chart;
let timer = null;
let time = 0;
const MAX_TIME = 10;

let flowRate = 1.0;
let organicPercent = 40;
let hydrophobicity = 0.55;
let sensitivity = 1.0;

const VOID_TIME = 1.0;
const COLUMN_FACTOR = 1.0;

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
const flowVal = document.getElementById("flowVal");
const organicInput = document.getElementById("organicInput");
const organicVal = document.getElementById("organicVal");
const compoundSelect = document.getElementById("compoundSelect");
const sensitivityInput = document.getElementById("sensitivityInput");
const sensitivityVal = document.getElementById("sensitivityVal");

/* Diagram elements */
let pumpBox, injectorBox, detectorLight, sampleBand, tubes;

/* INIT GRAPH */
function initGraph() {
  const ctx = document.getElementById("graphCanvas").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: { datasets: [{ data: [], borderColor: "#1565c0", pointRadius: 0 }] },
    options: { animation: false }
  });
}

/* RT CALC */
function calculateRT() {
  const elutionStrength = 0.3 + (organicPercent / 100) * 0.7;
  return VOID_TIME + (hydrophobicity * COLUMN_FACTOR) / (flowRate * elutionStrength);
}

/* RUN LOOP */
function startRun() {
  stopRun();
  resetGraph();
  animateFlow(true);

  timer = setInterval(() => {
    time += 0.05;

    let noise = (Math.random() - 0.5) * 0.02 * sensitivity;
    let signal = noise;

    if (injecting && time >= injectionTime) {
      signal += Math.exp(-Math.pow(time - peakRT, 2) / (2 * peakWidth ** 2)) * sensitivity;
      detectorLight.setAttribute("fill", "#ff5252");
    } else {
      detectorLight.setAttribute("fill", "#999");
    }

    chart.data.datasets[0].data.push({ x: time, y: signal });
    chart.update("none");

    if (time >= MAX_TIME) stopRun();
  }, 100);
}

/* INJECT */
function injectSample() {
  resetGraph();
  injecting = true;
  injectionTime = VOID_TIME;
  peakRT = calculateRT();

  injectorBox.classList.add("injectFlash");
  sampleBand.classList.add("bandActive");

  rtDisplay.textContent = `Estimated RT: ${peakRT.toFixed(2)} min`;
  startRun();
}

/* HELPERS */
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

/* DIAGRAM ANIMATION */
function animateFlow(on) {
  if (!tubes) return;
  tubes.forEach(t => t.classList.toggle("flow", on));
  pumpBox.classList.toggle("pulse", on);
}

/* CONTROLS */
flowInput.oninput = () => {
  flowRate = Number(flowInput.value);
  flowVal.textContent = flowRate.toFixed(1);
  rtDisplay.textContent = `Estimated RT: ${calculateRT().toFixed(2)} min`;
};

organicInput.oninput = () => {
  organicPercent = Number(organicInput.value);
  organicVal.textContent = `${organicPercent}%`;
};

compoundSelect.onchange = () => {
  hydrophobicity = Number(compoundSelect.value);
};

sensitivityInput.oninput = () => {
  sensitivity = Number(sensitivityInput.value);
  sensitivityVal.textContent = sensitivity.toFixed(1);
};

/* BUTTONS */
pumpBtn.onclick = () => {
  const running = pumpBtn.textContent.includes("STOP");
  pumpBtn.textContent = running ? "Pump START" : "Pump STOP";
  injectBtn.disabled = running;
  running ? stopRun() : startRun();
};

injectBtn.onclick = injectSample;

/* WAIT FOR SVG */
setTimeout(() => {
  pumpBox = document.getElementById("pumpBox");
  injectorBox = document.getElementById("injectorBox");
  detectorLight = document.getElementById("detectorLight");
  sampleBand = document.getElementById("sampleBand");
  tubes = document.querySelectorAll(".tube");
}, 600);

/* START */
initGraph();
sensitivityVal.textContent = sensitivity.toFixed(1);
rtDisplay.textContent = `Estimated RT: ${calculateRT().toFixed(2)} min`;