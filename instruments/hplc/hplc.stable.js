/* ==================================================
   STABLE REAL-TIME HPLC SIMULATOR
   STEP A: TINKER CONTROLS (FLOW, %B, COMPOUND)
   ================================================== */

let chart;
let timer = null;
let time = 0;
const MAX_TIME = 10;

/* --- METHOD PARAMETERS --- */
let flowRate = 1.0;
let organicPercent = 40;
let hydrophobicity = 0.55;

/* --- CONSTANTS --- */
const VOID_TIME = 1.0;
const COLUMN_FACTOR = 1.0;

/* --- PEAK STATE --- */
let injecting = false;
let peakRT = null;
let peakWidth = 0.25;

/* --- DOM --- */
const statusEl = document.getElementById("status");
const pumpBtn = document.getElementById("pumpBtn");
const injectBtn = document.getElementById("injectBtn");
const rtDisplay = document.getElementById("rtDisplay");

const flowInput = document.getElementById("flowInput");
const flowVal = document.getElementById("flowVal");
const organicInput = document.getElementById("organicInput");
const organicVal = document.getElementById("organicVal");
const compoundSelect = document.getElementById("compoundSelect");

/* -------- INIT GRAPH -------- */
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
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: MAX_TIME,
          title: { display: true, text: "Time (min)" }
        },
        y: {
          min: -0.1,
          max: 1.5,
          title: { display: true, text: "Response (AU)" }
        }
      }
    }
  });
}

/* -------- RT CALCULATION -------- */
function calculateRT() {
  const elutionStrength = 0.3 + (organicPercent / 100) * 0.7;

  const rt =
    VOID_TIME +
    (hydrophobicity * COLUMN_FACTOR) /
    (flowRate * elutionStrength);

  return Math.min(rt, MAX_TIME - 1);
}

/* -------- BASELINE + RUN LOOP -------- */
function startBaselineAndRun() {
  stopRun();
  resetGraph();

  timer = setInterval(() => {
    time += 0.05;

    let signal = (Math.random() - 0.5) * 0.02;

    if (injecting && peakRT !== null) {
      const peak =
        Math.exp(
          -Math.pow(time - peakRT, 2) /
          (2 * Math.pow(peakWidth, 2))
        );
      signal += peak;
    }

    addPoint(time, signal);

    if (time >= MAX_TIME) stopRun();
  }, 100);
}

/* -------- INJECT -------- */
function injectSample() {
  resetGraph();
  injecting = true;
  peakRT = calculateRT();

  rtDisplay.textContent =
    `Estimated RT: ${peakRT.toFixed(2)} min`;

  startBaselineAndRun();
}

/* -------- HELPERS -------- */
function addPoint(x, y) {
  chart.data.datasets[0].data.push({ x, y });
  chart.update("none");
}

function resetGraph() {
  stopRun();
  time = 0;
  chart.data.datasets[0].data = [];
  chart.update();
}

function stopRun() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

/* -------- CONTROL EVENTS -------- */
flowInput.oninput = () => {
  flowRate = Number(flowInput.value);
  flowVal.textContent = flowRate.toFixed(1);
  rtDisplay.textContent = `Estimated RT: ${calculateRT().toFixed(2)} min`;
};

organicInput.oninput = () => {
  organicPercent = Number(organicInput.value);
  organicVal.textContent = `${organicPercent}%`;
  rtDisplay.textContent = `Estimated RT: ${calculateRT().toFixed(2)} min`;
};

compoundSelect.onchange = () => {
  hydrophobicity = Number(compoundSelect.value);
  rtDisplay.textContent = `Estimated RT: ${calculateRT().toFixed(2)} min`;
};

/* -------- BUTTONS -------- */
pumpBtn.onclick = () => {
  const running = pumpBtn.textContent.includes("STOP");

  if (running) {
    pumpBtn.textContent = "Pump START";
    statusEl.textContent = "Status: IDLE";
    injectBtn.disabled = true;
    stopRun();
  } else {
    pumpBtn.textContent = "Pump STOP";
    statusEl.textContent = "Status: MOBILE PHASE RUNNING";
    injectBtn.disabled = false;
    injecting = false;
    startBaselineAndRun();
  }
};

injectBtn.onclick = () => {
  statusEl.textContent = "Status: SAMPLE INJECTED";
  injectSample();
};

/* -------- STARTUP -------- */
initGraph();
rtDisplay.textContent = `Estimated RT: ${calculateRT().toFixed(2)} min`;