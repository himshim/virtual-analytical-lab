export function generateHPLCData(state) {
  let data = [];

  for (let t = 0; t <= 12; t += 0.05) {
    let signal = Math.random() * 0.02;

    const rt = 3 / state.flow + 2;

    signal += Math.exp(-Math.pow(t - rt, 2) / 0.12);

    data.push({ x: t, y: signal });
  }

  return data;
}