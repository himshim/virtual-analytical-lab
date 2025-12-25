/* ==========================================
   STABLE REAL-TIME HPLC GRAPH
   STEP 2: TRUE PEAK ELUTION OVER TIME
   ========================================== */

/* -------- GLOBAL STATE -------- */
let chart;
let timer = null;
let time = 0;
const MAX_TIME = 10; // minutes

let injecting = false;
let peakRT = null;
let peakWidth = 0.15;

/* -------- DOM -------- */
const statusEl = document.getElementById("status");
const pumpBtn = document.getElementById("pumpBtn");
const injectBtn = document.getElementById("injectBtn");
const rtDisplay = document.getElementById("rtDisplay");

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

/* -------- BASELINE + RUN LOOP -------- */
function startBaselineAndRun() {
  stopRun();
  resetGraph();

  timer = setInterval(() => {
    time += 0.05;

    /* Baseline noise */
    let signal = (Math.random() - 0.5) * 0.02;

    /* True peak elution (Gaussian over time) */
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

/* -------- INJECT SAMPLE -------- */
function injectSample() {
  resetGraph();
  injecting = true;

  /* For now, fixed RT (STEP 1 will calculate this) */
  peakRT = 4.2;
  peakWidth = 0.25;

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

/* -------- BUTTON LOGIC -------- */
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