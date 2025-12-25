export function calculateEstimatedRT(state) {
  const comp = state.sample.components[0];

  return (
    2 +
    (comp.hydrophobicity * state.column.factor) /
    (state.mobilePhase.strength * state.flow)
  );
}