export const hplcState = {
  pumpOn: false,
  flow: 1.0,
  injected: false,

  column: {
    type: "C18",        // C18 | C8 | Silica
    length: 150,        // mm
    particleSize: 5,    // µm
    factor: 1.0,
    resistance: 1.2,
    efficiency: 1.0
  },

  mobilePhase: {
    solventA: {
      name: "Water",
      percent: 60,
      viscosity: 1.0
    },
    solventB: {
      name: "Acetonitrile",
      percent: 40,
      viscosity: 0.4
    },
    strength: 0.6,
    viscosity: 0.76
  },

  pressure: 0,
  maxPressure: 400,
  warning: false
};