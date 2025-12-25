/* ================================
   HPLC UI CONTROLLER (STEP 4 FIXED)
   ================================ */

import { hplcState, HPLC_STATES } from "./hplc.state.js";
import {
  updatePressure,
  updateMobilePhase,
  updateColumn,
  tickEquilibration,
  startRun
} from "./hplc.logic.js";

import {
  startFlowAnimation,
  stopFlowAnimation,
  injectSampleAnimation,
  initAnimation
} from "./hplc.animation.js";

import { samples } from "./samples.js";

/* ================================
   DOM ELEMENTS
   ================================ */

const statusEl = document.getElementById("status");
const pumpBtn = document.getElementById("pumpBtn");
const injectBtn = document.getElementById("injectBtn");
const pressureDisplay = document.getElementById("pressureDisplay");

const flow = document.getElementById("flow");
const solventB = document.getElementById("solventB");
const columnType = document.getElementById("columnType");
const sampleSelect = document.getElementById("sampleSelect");

/* ================================
   INITIALIZATION
   ================================ */

// Wait until SVG is injected before querying SVG elements
setTimeout(() => {
  initAnimation();
}, 200);

/* ================================
   CONTROL HANDLERS
   ================================ */

flow.oninput = () => {
  hplcState.flow = Number(flow.value);
  recalcSystem();
};

solventB.oninput = () => {
  const b = Number(solventB.value);
  hplcState.mobilePhase.solventB.percent = b;
  hplcState.mobilePhase.solventA.percent = 100 - b;
  recalcSystem();
};

columnType.onchange = () => {
  hplcState.column.type = columnType.value;
  recalcSystem();
};

sampleSelect.onchange = () => {
  hplcState.sample = samples[sampleSelect.value];
};

pumpBtn.onclick = () => {
  hplcState.pumpOn = !hplcState.pumpOn;

  pumpBtn.textContent = hplcState.pumpOn
    ? "Pump ON"
    : "Pump OFF";

  if (hplcState.pumpOn) {
    startFlowAnimation();
    hplcState.systemState = HPLC_STATES.EQUILIBRATING;
    hplcState.equilibration.timeLeft = 5;
  } else {
    stopFlowAnimation();
    hplcState.systemState = HPLC_STATES.IDLE;
  }
};

injectBtn.onclick = () => {
  if (hplcState.systemState !== HPLC_STATES.READY) return;

  injectSampleAnimation();
  startRun(hplcState);
};

/* ================================
   SYSTEM UPDATE LOOP
   ================================ */

setInterval(() => {
  if (hplcState.systemState === HPLC_STATES.EQUILIBRATING) {
    tickEquilibration(hplcState);
  }

  updateUI();
}, 1000);

/* ================================
   HELPERS
   ================================ */

function recalcSystem() {
  updateMobilePhase(hplcState);
  updateColumn(hplcState);
  updatePressure(hplcState);

  if (hplcState.warning) {
    hplcState.systemState = HPLC_STATES.ERROR;
    stopFlowAnimation();
  }
}

function updateUI() {
  statusEl.textContent =
    `Status: ${hplcState.systemState}`;

  injectBtn.disabled =
    hplcState.systemState !== HPLC_STATES.READY;

  pressureDisplay.textContent =
    `Pressure: ${hplcState.pressure.toFixed(0)} bar`;

  pressureDisplay.style.color =
    hplcState.warning ? "#d32f2f" : "#2e7d32";
}