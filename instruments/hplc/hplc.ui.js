import { hplcState, HPLC_STATES } from "./hplc.state.js";
import { calculateEstimatedRT } from "./hplc.logic.js";
import {
  initRealtimeGraph,
  startBaseline,
  injectSample,
  stopGraph,
  resetGraph
} from "./hplc.realtimeGraph.js";

import {
  startFlowAnimation,
  stopFlowAnimation,
  initAnimation,
  injectSampleAnimation
} from "./hplc.animation.js";

/* DOM */
const pumpBtn = document.getElementById("pumpBtn");
const injectBtn = document.getElementById("injectBtn");
const statusEl = document.getElementById("status");
const rtDisplay = document.getElementById("rtDisplay");

/* INIT */
setTimeout(() => {
  initAnimation();
  initRealtimeGraph();
  statusEl.textContent = "Status: IDLE";
}, 300);

/* PUMP */
pumpBtn.onclick = () => {
  hplcState.pumpOn = !hplcState.pumpOn;

  if (hplcState.pumpOn) {
    pumpBtn.textContent = "Pump ON";
    hplcState.systemState = HPLC_STATES.READY;
    startFlowAnimation();
    startBaseline();
  } else {
    pumpBtn.textContent = "Pump OFF";
    hplcState.systemState = HPLC_STATES.IDLE;
    stopFlowAnimation();
    stopGraph();
  }

  injectBtn.disabled = !hplcState.pumpOn;
  statusEl.textContent = `Status: ${hplcState.systemState}`;
};

/* INJECT */
injectBtn.onclick = () => {
  resetGraph();
  injectSampleAnimation();

  const rt = calculateEstimatedRT(hplcState);
  rtDisplay.textContent = `Estimated RT: ${rt.toFixed(2)} min`;

  injectSample(rt);
};