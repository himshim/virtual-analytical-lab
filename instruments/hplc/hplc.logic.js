import { renderGraph } from "../../graph/graphEngine.js";
import { generateHPLCFrame } from "./hplc.dataGenerator.js";
import { HPLC_STATES } from "./hplc.state.js";

/* ---------- Column & Mobile Phase Updates ---------- */
const columnPresets = {
  C18: { factor: 1.0, resistance: 1.2 },
  C8: { factor: 0.7, resistance: 1.0 },
  Silica: { factor: 1.4, resistance: 1.5 }
};

export function updateColumn(state) {
  const p = columnPresets[state.column.type];
  state.column.factor = p.factor * (state.column.length / 150);
  state.column.resistance =
    p.resistance * (state.column.length / 150) * (5 / state.column.particleSize);
  state.column.efficiency =
    (state.column.length / state.column.particleSize) / 30;

  forceEquilibration(state);
}

export function updateMobilePhase(state) {
  const A = state.mobilePhase.solventA;
  const B = state.mobilePhase.solventB;

  state.mobilePhase.strength = 0.3 + (B.percent / 100) * 0.7;
  state.mobilePhase.viscosity =
    (A.percent * A.viscosity + B.percent * B.viscosity) / 100;

  forceEquilibration(state);
}

export function updatePressure(state) {
  state.pressure =
    state.flow * state.column.resistance * state.mobilePhase.viscosity * 100;

  state.warning = state.pressure > state.maxPressure;
  if (state.warning) state.systemState = HPLC_STATES.ERROR;
}

/* ---------- Equilibration ---------- */
function forceEquilibration(state) {
  if (state.pumpOn) {
    state.systemState = HPLC_STATES.EQUILIBRATING;
    state.equilibration.required = true;
    state.equilibration.timeLeft = 5; // seconds (simulated)
  }
}

export function tickEquilibration(state) {
  if (state.systemState !== HPLC_STATES.EQUILIBRATING) return;

  state.equilibration.timeLeft -= 1;
  if (state.equilibration.timeLeft <= 0) {
    state.systemState = HPLC_STATES.READY;
    state.equilibration.required = false;
  }
}

/* ---------- Run Control ---------- */
let runInterval = null;
let liveData = [];

export function startRun(state) {
  if (state.systemState !== HPLC_STATES.READY) return;

  state.systemState = HPLC_STATES.RUNNING;
  state.runtime.time = 0;
  liveData = [];

  runInterval = setInterval(() => {
    state.runtime.time += 0.1;

    const frame = generateHPLCFrame(state);
    liveData.push(frame);

    renderGraph("graphCanvas", liveData, "HPLC Chromatogram");

    if (state.runtime.time >= state.runtime.duration) {
      clearInterval(runInterval);
      state.systemState = HPLC_STATES.COMPLETE;
    }
  }, 100);
}