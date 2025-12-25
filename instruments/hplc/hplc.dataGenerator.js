export function generateHPLCData(state) {
  let data = [];

  const baseRT = 2.0;
  const flow = state.flow;
  const strength = state.mobilePhase.strength;
  const columnFactor = state.column.factor;
  const efficiency = state.column.efficiency;

  // Pre-calculate RTs for each component
  const peaks = state.sample.components.map(comp => {
    const rt =
      baseRT +
      (comp.hydrophobicity * columnFactor) /
      (strength * flow);

    const width = 0.15 / efficiency;
    const height = comp.response;

    return { rt, width, height };
  });

  for (let t = 0; t <= 12; t += 0.05) {
    let signal = Math.random() * 0.02; // baseline noise

    peaks.forEach(p => {
      signal +=
        p.height *
        Math.exp(-Math.pow(t - p.rt, 2) / p.width);
    });

    data.push({ x: t, y: signal });
  }

  return data;
}