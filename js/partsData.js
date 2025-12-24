export const hplcParts = [
  {
    id: "reservoir",
    name: "Solvent Reservoir",
    function: "Stores and supplies the mobile phase"
  },
  {
    id: "pump",
    name: "Pump",
    function: "Delivers mobile phase at constant flow and pressure"
  },
  {
    id: "injector",
    name: "Injector",
    function: "Introduces sample into the mobile phase stream"
  },
  {
    id: "column",
    name: "Column",
    function: "Separates components based on stationary phase interaction"
  },
  {
    id: "detector",
    name: "Detector",
    function: "Detects eluted analytes and converts them into signals"
  },
  {
    id: "datasystem",
    name: "Data System",
    function: "Processes and displays chromatographic data"
  }
];

export const correctSequence = [
  "reservoir",
  "pump",
  "injector",
  "column",
  "detector",
  "datasystem"
];