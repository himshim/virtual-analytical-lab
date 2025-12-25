export function generateHPLCFrame(state) {
  const t = state.runtime.time;

  const noise =
    (Math.random() - 0.5) *
    0.02 *
    state.detector.sensitivity;

  let signal = noise;

  const baseRT = 2.0;
  const flow = state.flow;
  const strength = state.mobilePhase.strength;
  const colFactor = state.column.factor;
  const eff = state.column.efficiency;

  state.sample.components.forEach(comp => {
    const rt =
      baseRT +
      (comp.hydrophobicity * colFactor) /
      (strength * flow);

    const width = 0.15 / eff;

    const uvResponse = Math.exp(
      -Math.pow(
        state.detector.wavelength - comp.uvMax,
        2
      ) / 800
    );

    const height =
      comp.response *
      uvResponse *
      state.detector.sensitivity;

    signal +=
      height *
      Math.exp(-Math.pow(t - rt, 2) / width);
  });

  return { x: t, y: signal };
}