export function generateHPLCData(state) {
  let data = [];

  // Single compound for now (Step 3 = mixtures)
  const hydrophobicity = 0.55;

  const baseRT = 2.0;
  const rt =
    baseRT +
    (hydrophobicity * state.column.factor) /
    (state.mobilePhase.strength * state.flow);

  for (let t = 0; t <= 12; t += 0.05) {
    let signal = Math.random() * 0.02;

    signal += Math.exp(
      -Math.pow(t - rt, 2) / 0.12
    );

    data.push({ x: t, y: signal });
  }

  return data;
}