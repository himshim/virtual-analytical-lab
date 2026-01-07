document.addEventListener("DOMContentLoaded", () => {

  /* ========= STATES ========= */
  const STATES = {
    IDLE: "IDLE",
    PUMPING: "PUMPING",
    READY: "READY FOR INJECTION",
    RUNNING: "RUNNING",
    COMPLETED: "COMPLETED",
    STOPPED: "STOPPED"
  };

  let state = STATES.IDLE;

  /* ========= DOM ========= */
  const statusEl = document.getElementById("status");
  const pumpBtn = document.getElementById("pumpBtn");
  const injectBtn = document.getElementById("injectBtn");
  const rtDisplay = document.getElementById("rtDisplay");
  const canvas = document.getElementById("graphCanvas");

  const flowInput = document.getElementById("flowInput");
  const organicInput = document.getElementById("organicInput");
  const compoundSelect = document.getElementById("compoundSelect");
  const sensitivityInput = document.getElementById("sensitivityInput");

  /* ========= STATE HANDLER ========= */
  function setState(s) {
    state = s;
    statusEl.textContent = `Status: ${s}`;

    const lock = s !== STATES.IDLE;
    flowInput.disabled = lock;
    organicInput.disabled = lock;
    compoundSelect.disabled = lock;

    injectBtn.disabled = s !== STATES.READY;
  }

  /* ========= SIM CLOCK ========= */
  let t = 0;
  const DT = 0.05;
  const T_MAX = 10;
  let timer = null;

  /* ========= DETECTOR ========= */
  const Y_MIN = -0.2;
  const Y_MAX = 2.0;

  /* ========= CHART ========= */
  const chart = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      datasets: [{
        data: [],
        borderColor: "#1565c0",
        pointRadius: 0
      }]
    },
    options: {
      animation: false,
      parsing: false,
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: T_MAX,
          title: { display: true, text: "Time (min)" }
        },
        y: {
          min: Y_MIN,
          max: Y_MAX,
          title: { display: true, text: "Response (AU)" }
        }
      }
    }
  });

  function addPoint(x, y) {
    const clamped = Math.max(Y_MIN, Math.min(Y_MAX, y));
    chart.data.datasets[0].data.push({ x, y: clamped });
    chart.update("none");
  }

  function resetRun() {
    t = 0;
    chart.data.datasets[0].data = [];
    chart.update();
  }

  /* ========= CHEMISTRY ========= */
  function calculateRT() {
    const flow = Number(flowInput.value);
    const org = Number(organicInput.value);
    const hyd = SAMPLES[compoundSelect.value].hydrophobicity;
    const strength = 0.3 + 0.7 * (org / 100);
    return 1 + hyd / (flow * strength);
  }

  let peakRT = null;

  function baselineNoise() {
    return (Math.random() - 0.5) * 0.04 * Number(sensitivityInput.value);
  }

  /* ========= MAIN LOOP ========= */
  function tick() {
    t += DT;

    let y = baselineNoise();

    if (peakRT !== null) {
      const diff = t - peakRT;
      const sigma = peakRT * 0.04;
      if (Math.abs(diff) < 6 * sigma) {
        y += Math.exp(-(diff * diff) / (2 * sigma * sigma));
        setState(STATES.RUNNING);
      }
    }

    addPoint(t, y);

    if (t >= T_MAX) {
      stop();
      setState(STATES.COMPLETED);
    }
  }

  function start() {
    resetRun();
    peakRT = null;
    setState(STATES.PUMPING);

    timer = setInterval(tick, DT * 60 * 1000);

    setTimeout(() => {
      if (state === STATES.PUMPING)
        setState(STATES.READY);
    }, 2000);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  /* ========= BUTTONS ========= */
  pumpBtn.onclick = () => {
    if (timer) {
      pumpBtn.textContent = "Pump START";
      stop();
      setState(STATES.STOPPED);
    } else {
      pumpBtn.textContent = "Pump STOP";
      start();
    }
  };

  injectBtn.onclick = () => {
    if (state !== STATES.READY) return;
    peakRT = calculateRT();
    rtDisplay.textContent = `Estimated RT: ${peakRT.toFixed(2)} min`;
  };

  /* ========= INIT ========= */
  setState(STATES.IDLE);

});
