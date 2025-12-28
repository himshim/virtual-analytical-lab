/* ==========================================
   HPLC CONTROLLER WITH STATE-BASED UI LOCKOUTS
   ========================================== */

const HPLC_STATES = {
  IDLE: "IDLE",
  PUMPING: "PUMPING",
  READY: "READY FOR INJECTION",
  INJECTED: "SAMPLE INJECTED",
  RUNNING: "RUNNING",
  COMPLETED: "RUN COMPLETED",
  STOPPED: "STOPPED BY USER"
};

let currentState = HPLC_STATES.IDLE;

/* TIME */
let chart;
let timer = null;
let time = 0;
const MAX_TIME = 10;

/* METHOD */
let flowRate = 1.0;
let organicPercent = 40;
let sensitivity = 1.0;
let currentCompound = SAMPLES.caffeine;

/* PEAK */
let injecting = false;
let injectionTime = null;
let peakRT = null;
let peakWidth = 0.25;

/* DOM */
const statusEl = document.getElementById("status");
const pumpBtn = document.getElementById("pumpBtn");
const injectBtn = document.getElementById("injectBtn");

const flowInput = document.getElementById("flowInput");
const organicInput = document.getElementById("organicInput");
const compoundSelect = document.getElementById("compoundSelect");
const sensitivityInput = document.getElementById("sensitivityInput");

/* DIAGRAM */
let pumpBox, injectorBox, detectorLight, tubes;

/* ===== STATE HANDLER ===== */
function setState(state) {
  currentState = state;
  statusEl.textContent = `Status: ${state}`;

  const lockMethod = [
    HPLC_STATES.PUMPING,
    HPLC_STATES.READY,
    HPLC_STATES.INJECTED,
    HPLC_STATES.RUNNING,
    HPLC_STATES.COMPLETED
  ].includes(state);

  flowInput.disabled = lockMethod;
  organicInput.disabled = lockMethod;
  compoundSelect.disabled = lockMethod;

  injectBtn.disabled = state !== HPLC_STATES.READY;
}

/* ===== GRAPH ===== */
function initGraph() {
  chart = new Chart(
    document.getElementById("graphCanvas").getContext("2d"),
    {
      type: "line",
      data: { datasets: [{ data: [], borderColor: "#1565c0", pointRadius: 0 }] },
      options: {
        animation: false,
        parsing: false,
        scales: {
          x: { type: "linear", min: 0, max: MAX_TIME },
          y: { min: -0.3, max: 3.0 }
        }
      }
    }
  );
}

/* ===== RT ===== */
function calculateRT() {
  const elutionStrength = 0.3 + (organicPercent / 100) * 0.7;
  return 1.0 + currentCompound.hydrophobicity / (flowRate * elutionStrength);
}

/* ===== RUN ===== */
function startRun() {
  stopRun();
  resetGraph();
  animateFlow(true);
  setState(HPLC_STATES.PUMPING);

  setTimeout(() => {
    if (currentState === HPLC_STATES.PUMPING) {
      setState(HPLC_STATES.READY);
    }
  }, 2000);

  timer = setInterval(() => {
    time += 0.05;

    let signal = (Math.random() - 0.5) * 0.02 * sensitivity;

    if (injecting && time >= injectionTime) {
      setState(HPLC_STATES.RUNNING);
      signal += Math.exp(-(time - peakRT) ** 2 / (2 * peakWidth ** 2)) * sensitivity;
      detectorLight?.setAttribute("fill", "#ff5252");
    } else {
      detectorLight?.setAttribute("fill", "#999");
    }

    chart.data.datasets[0].data.push({ x: time, y: signal });
    chart.update("none");

    if (time >= MAX_TIME) {
      setState(HPLC_STATES.COMPLETED);
      stopRun();
    }
  }, 100);
}

/* ===== INJECT ===== */
function injectSample() {
  if (currentState !== HPLC_STATES.READY) return;

  injecting = true;
  injectionTime = 1.0;
  peakRT = calculateRT();
  injectorBox?.classList.add("injectFlash");
  setState(HPLC_STATES.INJECTED);
}

/* ===== HELPERS ===== */
function resetGraph() {
  stopRun();
  time = 0;
  injecting = false;
  chart.data.datasets[0].data = [];
  chart.update();
}

function stopRun() {
  if (timer) clearInterval(timer);
  animateFlow(false);
}

/* ===== DIAGRAM ===== */
function animateFlow(on) {
  tubes?.forEach(t => t.classList.toggle("flow", on));
  pumpBox?.classList.toggle("pulse", on);
}

/* ===== CONTROLS ===== */
flowInput.oninput = () => flowRate = Number(flowInput.value);
organicInput.oninput = () => organicPercent = Number(organicInput.value);
compoundSelect.onchange = () => currentCompound = SAMPLES[compoundSelect.value];
sensitivityInput.oninput = () => sensitivity = Number(sensitivityInput.value);

/* ===== BUTTONS ===== */
pumpBtn.onclick = () => {
  const running = pumpBtn.textContent.includes("STOP");

  if (running) {
    pumpBtn.textContent = "Pump START";
    setState(HPLC_STATES.STOPPED);
    stopRun();
  } else {
    pumpBtn.textContent = "Pump STOP";
    startRun();
  }
};

injectBtn.onclick = injectSample;

/* ===== SVG ===== */
setTimeout(() => {
  pumpBox = document.getElementById("pumpBox");
  injectorBox = document.getElementById("injectorBox");
  detectorLight = document.getElementById("detectorLight");
  tubes = document.querySelectorAll(".tube");
}, 500);

/* ===== START ===== */
initGraph();
setState(HPLC_STATES.IDLE);