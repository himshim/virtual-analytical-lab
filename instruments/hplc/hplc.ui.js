import { hplcState } from "./hplc.state.js";
import { runHPLC } from "./hplc.logic.js";

const flowSlider = document.getElementById("flow");
const flowVal = document.getElementById("flowVal");
const pumpBtn = document.getElementById("pumpBtn");
const injectBtn = document.getElementById("injectBtn");

flowSlider.oninput = () => {
  hplcState.flow = Number(flowSlider.value);
  flowVal.textContent = flowSlider.value;
};

pumpBtn.onclick = () => {
  hplcState.pumpOn = !hplcState.pumpOn;
  pumpBtn.textContent = hplcState.pumpOn ? "Pump ON" : "Pump OFF";
  injectBtn.disabled = !hplcState.pumpOn;
};

injectBtn.onclick = () => {
  hplcState.injected = true;
  runHPLC(hplcState);
};