import { generateHPLCData } from "./hplc.dataGenerator.js";
import { renderGraph } from "../../graph/graphEngine.js";

export function runHPLC(state) {
  if (!state.injected) return;

  const data = generateHPLCData(state);

  renderGraph(
    "graphCanvas",
    data,
    "HPLC Chromatogram"
  );

  state.injected = false;
}