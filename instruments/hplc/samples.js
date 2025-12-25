export const samples = {
  caffeine: {
    name: "Caffeine",
    components: [
      {
        name: "Caffeine",
        hydrophobicity: 0.55,
        response: 1.0
      }
    ]
  },

  paracetamol: {
    name: "Paracetamol",
    components: [
      {
        name: "Paracetamol",
        hydrophobicity: 0.35,
        response: 0.9
      }
    ]
  },

  mixture_pc: {
    name: "Paracetamol + Caffeine",
    components: [
      {
        name: "Paracetamol",
        hydrophobicity: 0.35,
        response: 0.9
      },
      {
        name: "Caffeine",
        hydrophobicity: 0.55,
        response: 1.0
      }
    ]
  },

  mixture_icp: {
    name: "Ibuprofen + Caffeine + Paracetamol",
    components: [
      {
        name: "Ibuprofen",
        hydrophobicity: 0.85,
        response: 1.2
      },
      {
        name: "Caffeine",
        hydrophobicity: 0.55,
        response: 1.0
      },
      {
        name: "Paracetamol",
        hydrophobicity: 0.35,
        response: 0.9
      }
    ]
  }
};