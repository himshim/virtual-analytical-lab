/* ==========================================
   HPLC SAMPLE DEFINITIONS (LSS Model Updated)
   ========================================== */

export const SAMPLES = {
  paracetamol: {
    name: "Paracetamol",
    kw: 20,       // Low retention in 100% water
    S: 2.8,       // Low sensitivity to organic solvent changes
    height: 1.0
  },
  caffeine: {
    name: "Caffeine",
    kw: 65,       // Moderate retention
    S: 3.5,       // Moderate sensitivity
    height: 1.0
  },
  aspirin: {
    name: "Aspirin",
    kw: 150,      // High retention
    S: 4.2,       // Strong sensitivity to organic solvent
    height: 0.9
  },
  ibuprofen: {
    name: "Ibuprofen",
    kw: 900,      // Extremely hydrophobic, sticks hard in water
    S: 5.1,       // Highly sensitive (elutes quickly once organic % is high enough)
    height: 0.8
  },
  mixture: {
    name: "Mixture (all four)",
    components: ["paracetamol", "caffeine", "aspirin", "ibuprofen"]
  }
};
