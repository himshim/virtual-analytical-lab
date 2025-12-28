/* ==========================================
   HPLC UI + ANIMATION CONTROLLER
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
let pumpBox, injectorBox, detectorLight, sampleBand, tubes;

/* GRAPH */
function initGraph() {
  chart = new Chart(
    document.getElementById("graphCanvas").getContext("2d"),
    { type: "line", data: { datasets: [{ data: [], borderColor: "#1565c0", pointRadius: 0 }] }, options: { animation: false } }
  );
}

/* RUN LOOP */
function startRun() {
  stopRun();
  resetGraph();
  animateFlow(true);

  timer = setInterval(() => {
    time += 0.05;

    let signal = HPLC_ENGINE.baselineNoise(sensitivity);

    if (injecting && time >= injectionTime) {
      signal += HPLC_ENGINE.peakSignal(
        time,
        peakRT,
        peakWidth,
        currentCompound.height * sensitivity
      );
      detectorLight?.setAttribute("fill", "#ff5252");
    } else {
      detectorLight?.setAttribute("fill", "#999");
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
  injectionTime = HPLC_ENGINE.VOID_TIME;
  peakRT = HPLC_ENGINE.calculateRT(flowRate, organicPercent, currentCompound);

  rtDisplay.textContent = `Estimated RT: ${peakRT.toFixed(2)} min`;
  injectorBox?.classList.add("injectFlash");
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

function animateFlow(on) {
  tubes?.forEach(t => t.classList.toggle("flow", on));
  pumpBox?.classList.toggle("pulse", on);
}

/* CONTROLS */
flowInput.oninput = () => flowRate = Number(flowInput.value);
organicInput.oninput = () => organicPercent = Number(organicInput.value);
compoundSelect.onchange = () => currentCompound = SAMPLES[compoundSelect.value];
sensitivityInput.oninput = () => sensitivity = Number(sensitivityInput.value);

/* BUTTONS */
pumpBtn.onclick = () => {
  const running = pumpBtn.textContent.includes("STOP");
  pumpBtn.textContent = running ? "Pump START" : "Pump STOP";
  injectBtn.disabled = running;
  running ? stopRun() : startRun();
};

injectBtn.onclick = injectSample;

/* SVG HOOKS */
setTimeout(() => {
  pumpBox = document.getElementById("pumpBox");
  injectorBox = document.getElementById("injectorBox");
  detectorLight = document.getElementById("detectorLight");
  sampleBand = document.getElementById("sampleBand");
  tubes = document.querySelectorAll(".tube");
}, 500);

/* START */
initGraph();