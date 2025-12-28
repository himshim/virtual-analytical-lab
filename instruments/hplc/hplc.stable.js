/* ==========================================
   HPLC UI + ANIMATION CONTROLLER
   WITH EXPLICIT SYSTEM STATES
   ========================================== */

/* ===== HPLC STATES ===== */
const HPLC_STATES = {
  IDLE: "IDLE",
  PUMPING: "PUMPING (Mobile phase flowing)",
  EQUILIBRATING: "EQUILIBRATING (Column stabilizing)",
  READY: "READY FOR INJECTION",
  INJECTED: "SAMPLE INJECTED",
  RUNNING: "RUNNING (Analytes eluting)",
  COMPLETED: "RUN COMPLETED",
  STOPPED: "STOPPED BY USER"
};

let currentState = HPLC_STATES.IDLE;

/* ===== TIME & RUN ===== */
let chart;
let timer = null;
let time = 0;
const MAX_TIME = 10;

/* ===== METHOD PARAMETERS ===== */
let flowRate = 1.0;
let organicPercent = 40;
let sensitivity = 1.0;
let currentCompound = SAMPLES.caffeine;

/* ===== PEAK ===== */
let injecting = false;
let injectionTime = null;
let peakRT = null;
let peakWidth = 0.25;

/* ===== DOM ===== */
const statusEl = document.getElementById("status");
const pumpBtn = document.getElementById("pumpBtn");
const injectBtn = document.getElementById("injectBtn");
const rtDisplay = document.getElementById("rtDisplay");

const flowInput = document.getElementById("flowInput");
const organicInput = document.getElementById("organicInput");
const compoundSelect = document.getElementById("compoundSelect");
const sensitivityInput = document.getElementById("sensitivityInput");

/* ===== DIAGRAM ===== */
let pumpBox, injectorBox, detectorLight, tubes;

/* ===== UTIL ===== */
function setState(state) {
  currentState = state;
  statusEl.textContent = `Status: ${state}`;
}

/* ===== GRAPH INIT ===== */
function initGraph() {
  chart = new Chart(
    document.getElementById("graphCanvas").getContext("2d"),
    {
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
        parsing: false,
        scales: {
          x: {
            type: "linear",
            min: 0,
            max: MAX_TIME,
            title: { display: true, text: "Time (min)" }
          },
          y: {
            min: -0.3,
            max: 3.0,
            title: { display: true, text: "Response (AU)" }
          }
        }
      }
    }
  );
}

/* ===== RT CALC ===== */
function calculateRT() {
  const elutionStrength = 0.3 + (organicPercent / 100) * 0.7;
  return 1.0 + (currentCompound.hydrophobicity) / (flowRate * elutionStrength);
}

/* ===== RUN LOOP ===== */
function startRun() {
  stopRun();
  resetGraph();
  animateFlow(true);

  setState(HPLC_STATES.PUMPING);

  /* Equilibration phase */
  setTimeout(() => {
    if (currentState !== HPLC_STATES.PUMPING) return;
    setState(HPLC_STATES.READY);
    injectBtn.disabled = false;
  }, 2000);

  timer = setInterval(() => {
    time += 0.05;

    let signal = (Math.random() - 0.5) * 0.02 * sensitivity;

    if (injecting && time >= injectionTime) {
      setState(HPLC_STATES.RUNNING);

      signal += Math.exp(
        -Math.pow(time - peakRT, 2) /
        (2 * peakWidth * peakWidth)
      ) * sensitivity;

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

  rtDisplay.textContent = `Estimated RT: ${peakRT.toFixed(2)} min`;
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
    injectBtn.disabled = true;
    setState(HPLC_STATES.STOPPED);
    stopRun();
  } else {
    pumpBtn.textContent = "Pump STOP";
    injectBtn.disabled = true;
    startRun();
  }
};

injectBtn.onclick = injectSample;

/* ===== SVG HOOK ===== */
setTimeout(() => {
  pumpBox = document.getElementById("pumpBox");
  injectorBox = document.getElementById("injectorBox");
  detectorLight = document.getElementById("detectorLight");
  tubes = document.querySelectorAll(".tube");
}, 500);

/* ===== START ===== */
initGraph();
setState(HPLC_STATES.IDLE);