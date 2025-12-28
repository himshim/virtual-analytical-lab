/* ==========================================
   HPLC CHEMISTRY ENGINE
   ========================================== */

const HPLC_ENGINE = {
  VOID_TIME: 1.0,
  COLUMN_FACTOR: 1.0,

  calculateRT(flowRate, organicPercent, compound) {
    const elutionStrength = 0.3 + (organicPercent / 100) * 0.7;

    return (
      this.VOID_TIME +
      (compound.hydrophobicity * this.COLUMN_FACTOR) /
      (flowRate * elutionStrength)
    );
  },

  peakSignal(time, peakRT, width, height) {
    return (
      height *
      Math.exp(
        -Math.pow(time - peakRT, 2) /
        (2 * Math.pow(width, 2))
      )
    );
  },

  baselineNoise(sensitivity) {
    return (Math.random() - 0.5) * 0.02 * sensitivity;
  }
};