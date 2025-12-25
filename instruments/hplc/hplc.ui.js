/* ================================
   HPLC UI CONTROLLER (STEP 4 – FIXED & REALTIME)
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

/* OPTIONAL (if present in HTML) */
const flowVal = document.getElementById("flowVal");
const solventBVal = document.getElementById("solventBVal");
const rtDisplay = document.getElementById("rtDisplay");

/* ================================
   INITIALIZATION
   ================================ */

setTimeout(() => {
  initAnimation();
  recalcSystem();
  updateUI();
}, 300);

/* ================================
   CONTROL HANDLERS
   ================================ */

flow.oninput = () => {
  hplcState.flow = Number(flow.value);
  if (flowVal) flowVal.textContent = flow.value;
  recalcSystem();
};

solventB.oninput = () => {
  const b = Number(solventB.value);
  hplcState.mobilePhase.solventB.percent = b;
  hplcState.mobilePhase.solventA.percent = 100 - b;
  if (solventBVal) solventBVal.textContent = `${b}% B`;
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

  updateUI();
};

injectBtn.onclick = () => {
  if (hplcState.systemState !== HPLC_STATES.READY) return;

  hplcState.systemState = HPLC_STATES.RUNNING;
  injectSampleAnimation();
  startRun(hplcState);
  updateUI();
};

/* ================================
   SYSTEM CLOCK (1s TICK)
   ================================ */

setInterval(() => {
  if (hplcState.systemState === HPLC_STATES.EQUILIBRATING) {
    tickEquilibration(hplcState);

    if (!hplcState.equilibration.required) {
      hplcState.systemState = HPLC_STATES.READY;
    }
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
  statusEl.textContent = `Status: ${hplcState.systemState}`;

  injectBtn.disabled =
    hplcState.systemState !== HPLC_STATES.READY;

  pressureDisplay.textContent =
    `Pressure: ${hplcState.pressure.toFixed(0)} bar`;

  pressureDisplay.style.color =
    hplcState.warning ? "#d32f2f" : "#2e7d32";

  /* Estimated RT display (educational) */
  if (rtDisplay) {
    const comp = hplcState.sample.components[0];
    const rt =
      2 +
      (comp.hydrophobicity * hplcState.column.factor) /
      (hplcState.mobilePhase.strength * hplcState.flow);

    rtDisplay.textContent = `Estimated RT: ${rt.toFixed(2)} min`;
  }
}