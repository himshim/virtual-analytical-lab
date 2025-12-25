import { hplcState } from "./hplc.state.js";
import {
  runHPLC,
  updatePressure,
  updateMobilePhase
} from "./hplc.logic.js";

import {
  startFlowAnimation,
  stopFlowAnimation,
  injectSampleAnimation
} from "./hplc.animation.js";

const flow = document.getElementById("flow");
const flowVal = document.getElementById("flowVal");
const pumpBtn = document.getElementById("pumpBtn");
const injectBtn = document.getElementById("injectBtn");

const solventB = document.getElementById("solventB");
const solventBVal = document.getElementById("solventBVal");

const pressureDisplay = document.getElementById("pressureDisplay");

flow.oninput = () => {
  hplcState.flow = Number(flow.value);
  flowVal.textContent = flow.value;
  updateAll();
};

solventB.oninput = () => {
  const b = Number(solventB.value);
  hplcState.mobilePhase.solventB.percent = b;
  hplcState.mobilePhase.solventA.percent = 100 - b;
  solventBVal.textContent = `${b}% ACN`;
  updateAll();
};

pumpBtn.onclick = () => {
  hplcState.pumpOn = !hplcState.pumpOn;
  pumpBtn.textContent = hplcState.pumpOn ? "Pump ON" : "Pump OFF";
  injectBtn.disabled = !hplcState.pumpOn;

  hplcState.pumpOn ? startFlowAnimation() : stopFlowAnimation();
};

injectBtn.onclick = () => {
  hplcState.injected = true;
  injectSampleAnimation();
  runHPLC(hplcState);
};

function updateAll() {
  updateMobilePhase(hplcState);
  updatePressure(hplcState);

  pressureDisplay.textContent =
    `Pressure: ${hplcState.pressure.toFixed(0)} bar`;

  pressureDisplay.style.color =
    hplcState.warning ? "#d32f2f" : "#2e7d32";
}