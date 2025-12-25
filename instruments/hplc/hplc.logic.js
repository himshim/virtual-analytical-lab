import { renderGraph } from "../../graph/graphEngine.js";
import { generateHPLCData } from "./hplc.dataGenerator.js";

export function updateMobilePhase(state) {
  const A = state.mobilePhase.solventA;
  const B = state.mobilePhase.solventB;

  // Elution strength (RP-HPLC approximation)
  state.mobilePhase.strength =
    0.3 + (B.percent / 100) * 0.7;

  // Viscosity (weighted average)
  state.mobilePhase.viscosity =
    (A.percent * A.viscosity +
     B.percent * B.viscosity) / 100;
}

export function updatePressure(state) {
  state.pressure =
    state.flow *
    state.column.resistance *
    state.mobilePhase.viscosity *
    100;

  state.warning = state.pressure > state.maxPressure;
}

export function runHPLC(state) {
  if (!state.injected || state.warning) return;

  const data = generateHPLCData(state);

  renderGraph(
    "graphCanvas",
    data,
    "HPLC Chromatogram"
  );

  state.injected = false;
}