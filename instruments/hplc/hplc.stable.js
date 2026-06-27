import { SAMPLES } from './samples.js';
import { getDeadTime, getRetentionFactor, getPeakSigma, getBaselineNoise, getSystemPressure } from './hplc.math.js';

async function injectDiagramSVG() {
  const container = document.getElementById("diagramContainer");
  if (!container) return;
  try {
    const response = await fetch("./hplc.diagram.svg");
    if (!response.ok) throw new Error("SVG not found");
    container.innerHTML = await response.text();
  } catch (error) {
    container.textContent = "Diagram unavailable.";
    console.error("SVG Load Error:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const STATES = { BOOTING: "INITIALIZING...", IDLE: "IDLE", READY: "READY FOR INJECTION", RUNNING: "RUNNING", COMPLETED: "COMPLETED", STOPPED: "STOPPED" };
  let state = STATES.BOOTING;

  // DOM Elements
  const statusEl = document.getElementById("status");
  const pumpBtn = document.getElementById("pumpBtn");
  const injectBtn = document.getElementById("injectBtn");
  const flowInput = document.getElementById("flowInput");
  const organicInput = document.getElementById("organicInput");
  const compoundSelect = document.getElementById("compoundSelect");
  const pressureMeter = document.getElementById("pressureMeter");
  const pressureVal = document.getElementById("pressureVal");
  const pressureWarning = document.getElementById("pressureWarning");
  const satWarning = document.getElementById("satWarning");

  function setState(s) {
    state = s;
    statusEl.textContent = s;
    const isPumpOff = (s === STATES.IDLE || s === STATES.STOPPED || s === STATES.COMPLETED || s === STATES.READY);
    flowInput.disabled = !isPumpOff;
    organicInput.disabled = !isPumpOff;
    injectBtn.disabled = (s !== STATES.READY);
    pumpBtn.disabled = (s === STATES.BOOTING);
    pumpBtn.textContent = isPumpOff ? "▶ Pump START" : "⏹ Pump STOP";
  }

  function updatePressure() {
    const p = getSystemPressure(Number(flowInput.value), Number(organicInput.value));
    pressureMeter.value = p;
    pressureVal.textContent = Math.round(p) + " bar";
    return p;
  }

  pumpBtn.onclick = () => {
    if (state === STATES.READY || state === STATES.BOOTING) return;
    if (state === STATES.RUNNING) {
      clearInterval(timer);
      setState(STATES.STOPPED);
    } else {
      if (updatePressure() > 400) return;
      setState(STATES.READY);
      timer = setInterval(tick, 200);
    }
  };

  await injectDiagramSVG();
  setState(STATES.IDLE);
});
