/* ==========================================
   HPLC Controller — stable baseline & detector range
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ===== STATES ===== */
  const HPLC_STATES = {
    IDLE: "IDLE",
    PUMPING: "PUMPING (mobile phase flowing)",
    READY: "READY FOR INJECTION",
    INJECTED: "SAMPLE QUEUED",
    RUNNING: "RUNNING (analytes eluting)",
    COMPLETED: "RUN COMPLETED",
    STOPPED: "STOPPED BY USER"
  };

  let currentState = HPLC_STATES.IDLE;

  /* ===== SIM CLOCK ===== */
  const MAX_TIME = 10;
  const DT = 0.05;        // min per tick
  let simTime = 0;
  let timerId = null;

  /* ===== DETECTOR RANGE (CRITICAL FIX) ===== */
  const DETECTOR_MIN = -0.2;
  const DETECTOR_MAX = 2.0;

  /* ===== METHOD ===== */
  let flowRate = 1.0;
  let organicPercent = 40;
  let sensitivity = 1.0;
  let currentCompound = SAMPLES.caffeine;

  /* ===== INJECTION ===== */
  let injectionEvent = null;

  /* ===== DOM ===== */
  const statusEl = document.getElementById("status");
  const pumpBtn = document.getElementById("pumpBtn");
  const injectBtn = document.getElementById("injectBtn");
  const rtDisplay = document.getElementById("rtDisplay");

  const flowInput = document.getElementById("flowInput");
  const organicInput = document.getElementById("organicInput");
  const compoundSelect = document.getElementById("compoundSelect");
  const sensitivityInput = document.getElementById("sensitivityInput");

  const graphCanvas = document.getElementById("graphCanvas");

  /* ===== CHART ===== */
  let chart = null;

  function initGraph() {
    chart = new Chart(graphCanvas.getContext("2d"), {
      type: "line",
      data: {
        datasets: [{
          label: "HPLC Chromatogram",
          data: [],
          borderColor: "#1565c0",
          borderWidth: 2,
          pointRadius: 0
        }]
      },
      options: {
        animation: false,
        parsing: false,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "linear",
            min: 0,
            max: MAX_TIME,
            title: { display: true, text: "Time (min)" }
          },
          y: {
            min: DETECTOR_MIN,
            max: DETECTOR_MAX,
            title: { display: true, text: "Response (AU)" }
          }
        }
      }
    });
  }

  function addPoint(t, y) {
    // Clamp signal to detector range
    const clamped = Math.max(DETECTOR_MIN, Math.min(DETECTOR_MAX, y));
    chart.data.datasets[0].data.push({ x: t, y: clamped });
    chart.update("none");
  }

  function resetGraph() {
    chart.data.datasets[0].data = [];
    chart.update();
  }

  /* ===== STATE ===== */
  function setState(state) {
    currentState = state;
    statusEl.textContent = `Status: ${state}`;
    const lock = state !== HPLC_STATES.IDLE;
    flowInput.disabled = lock;
    organicInput.disabled = lock;
    compoundSelect.disabled = lock;
    injectBtn.disabled = state !== HPLC_STATES.READY;
  }

  /* ===== CHEMISTRY ===== */
  function calculateRT() {
    const elutionStrength = 0.3 + (organicPercent / 100) * 0.7;
    return 1.0 + currentCompound.hydrophobicity / (flowRate * elutionStrength);
  }

  /* ===== BASELINE (FIXED) ===== */
  function baselineSignal() {
    // bounded noise, zero-mean
    return (Math.random() - 0.5) * 0.05 * sensitivity;
  }

  /* ===== RUN LOOP ===== */
  function runTick() {
    simTime = +(simTime + DT).toFixed(4);

    let signal = baselineSignal();

    if (injectionEvent) {
      const diff = simTime - injectionEvent.peakRT;
      const sigma = injectionEvent.peakRT * 0.03;
      if (Math.abs(diff) < 6 * sigma) {
        signal += Math.exp(-(diff * diff) / (2 * sigma * sigma)) * sensitivity;
        setState(HPLC_STATES.RUNNING);
      }
    }

    addPoint(simTime, signal);

    if (simTime >= MAX_TIME) {
      stopLoop();
      setState(HPLC_STATES.COMPLETED);
    }
  }

  function startLoop() {
    if (timerId) return;
    timerId = setInterval(runTick, DT * 60 * 1000);
  }

  function stopLoop() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  /* ===== CONTROLS ===== */
  pumpBtn.onclick = () => {
    if (timerId) {
      pumpBtn.textContent = "Pump START";
      stopLoop();
      setState(HPLC_STATES.STOPPED);
    } else {
      pumpBtn.textContent = "Pump STOP";
      simTime = 0;
      resetGraph();
      injectionEvent = null;
      setState(HPLC_STATES.PUMPING);
      startLoop();
      setTimeout(() => {
        if (currentState === HPLC_STATES.PUMPING)
          setState(HPLC_STATES.READY);
      }, 2000);
    }
  };

  injectBtn.onclick = () => {
    if (currentState !== HPLC_STATES.READY) return;
    const peakRT = calculateRT();
    injectionEvent = { peakRT };
    rtDisplay.textContent = `Estimated RT: ${peakRT.toFixed(2)} min`;
    setState(HPLC_STATES.INJECTED);
  };

  /* ===== INIT ===== */
  initGraph();
  setState(HPLC_STATES.IDLE);

});
