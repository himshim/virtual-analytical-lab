/* ==========================================
   HPLC Controller — single authoritative run loop
   - One timer
   - Explicit state machine
   - Proper UI lockouts
   - Uses HPLC_ENGINE and SAMPLES (external)
   - DOM-safe (waits for DOMContentLoaded)
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

  /* ===== SIM CLOCK & GRAPH ===== */
  const MAX_TIME = 10;      // minutes shown on the x-axis
  const DT = 0.05;         // minutes per tick (0.05 = 3 seconds real per tick * 20 ticks/min)
  let simTime = 0;         // minutes since pump start
  let timerId = null;

  /* ===== METHOD PARAMETERS ===== */
  let flowRate = 1.0;       // mL/min
  let organicPercent = 40;  // %B
  let sensitivity = 1.0;    // detector sensitivity multiplier
  let currentSample = null; // array of compounds (from SAMPLES)

  /* ===== INJECTION & PEAK ===== */
  let injectionEvent = null; // { time: simTime, compounds: [...], peakRTs: [...] }
  // peakRTs are absolute simTimes when each compound will elute (computed at injection)

  /* ===== DOM ELEMENTS (queried AFTER DOM ready) ===== */
  const statusEl = document.getElementById("status");
  const pumpBtn = document.getElementById("pumpBtn");
  const injectBtn = document.getElementById("injectBtn");
  const rtDisplay = document.getElementById("rtDisplay");

  const flowInput = document.getElementById("flowInput");
  const flowVal = document.getElementById("flowVal");
  const organicInput = document.getElementById("organicInput");
  const organicVal = document.getElementById("organicVal");
  const compoundSelect = document.getElementById("compoundSelect");
  const sensitivityInput = document.getElementById("sensitivityInput");
  const sensitivityVal = document.getElementById("sensitivityVal");

  const graphCanvas = document.getElementById("graphCanvas");

  /* Diagram elements (loaded after SVG injection) */
  let pumpBox, injectorBox, detectorLight, tubes;

  /* Chart.js instance */
  let chart = null;

  /* ===== Helper: set state & handle UI lockouts ===== */
  function setState(state) {
    currentState = state;
    if (statusEl) statusEl.textContent = `Status: ${state}`;

    // Method parameters editable only in IDLE
    const methodLocked = state !== HPLC_STATES.IDLE;
    if (flowInput) flowInput.disabled = methodLocked;
    if (organicInput) organicInput.disabled = methodLocked;
    if (compoundSelect) compoundSelect.disabled = methodLocked;

    // Inject allowed only in READY
    if (injectBtn) injectBtn.disabled = (state !== HPLC_STATES.READY);

    // Pump button always enabled (user can always stop)
    // Visual change of pump button text handled by pump click handler
  }

  /* ===== Chart initialization (linear x axis) ===== */
  function initGraph() {
    if (!graphCanvas) return;

    const ctx = graphCanvas.getContext("2d");
    chart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [{
          label: "HPLC Chromatogram",
          data: [],
          borderColor: "#1565c0",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.15
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
            title: { display: true, text: "Time (min)" },
            min: 0,
            max: MAX_TIME
          },
          y: {
            title: { display: true, text: "Response (AU)" },
            min: -0.3,
            max: 3.0
          }
        }
      }
    });
  }

  /* ===== Utility: append point to chart ===== */
  function addPoint(time, value) {
    if (!chart) return;
    chart.data.datasets[0].data.push({ x: time, y: value });
    chart.update("none");
  }

  /* ===== Reset graph (called intentionally) ===== */
  function resetGraph() {
    if (!chart) return;
    chart.data.datasets[0].data = [];
    chart.update();
  }

  /* ===== Compute peak RTs at injection =====
     Uses existing HPLC_ENGINE.calculateRT(flow, organic, compound)
     That function returns an RT measured from a zero baseline (it usually includes t0),
     so to compute the absolute elution time relative to current simTime we:
       peakTime = simTime + (calculateRT(...) - HPLC_ENGINE.VOID_TIME)
  */
  function computePeakRTsForSample(sampleArray) {
    const peakRTs = [];
    for (const comp of sampleArray) {
      // Defensive: if HPLC_ENGINE not present, fallback to simple formula
      if (typeof HPLC_ENGINE !== "undefined" && typeof HPLC_ENGINE.calculateRT === "function" && typeof HPLC_ENGINE.VOID_TIME === "number") {
        const absRT = HPLC_ENGINE.calculateRT(flowRate, organicPercent, comp); // absolute RT measured from t=0 if injected at t0
        const relDelay = Math.max(0, absRT - HPLC_ENGINE.VOID_TIME); // minutes after injection
        peakRTs.push(simTime + relDelay);
      } else {
        // fallback: simple proportional retention
        const elutionStrength = 0.3 + (organicPercent / 100) * 0.7;
        const retention = comp.hydrophobicity / (flowRate * elutionStrength);
        const relDelay = Math.max(0, retention);
        peakRTs.push(simTime + relDelay + 1.0); // add small t0 = 1.0
      }
    }
    return peakRTs;
  }

  /* ===== Baseline noise (sensitivity-scaled) ===== */
  function baselineNoise() {
    return (Math.random() - 0.5) * 0.02 * sensitivity;
  }

  /* ===== Single-run loop (authoritative) ===== */
  function runTick() {
    // Advance sim clock
    simTime = +(simTime + DT).toFixed(6); // small rounding stability

    // Baseline
    let signal = baselineNoise();

    // If injection event scheduled and simTime reached, add peaks contributions
    if (injectionEvent) {
      // For each compound compute its instantaneous contribution (Gaussian)
      for (let i = 0; i < injectionEvent.compounds.length; i++) {
        const comp = injectionEvent.compounds[i];
        const peakTime = injectionEvent.peakRTs[i];
        const sigma = Math.max(0.01, peakTime * 0.02); // width scale with RT (small)
        const diff = simTime - peakTime;

        // Only compute within 6 sigma for performance
        if (Math.abs(diff) <= 6 * sigma) {
          // amplitude scaled by compound height and sensitivity
          const amplitude = (comp.height || 1.0) * sensitivity;
          const contrib = amplitude * Math.exp(- (diff * diff) / (2 * sigma * sigma));
          signal += contrib;
        }
      }
    }

    // Push to graph
    addPoint(simTime, signal);

    // Drive detector visual if available
    if (detectorLight) {
      // turn on if a peak imminent or present (simple threshold)
      const recent = injectionEvent ? injectionEvent.peakRTs.some(rt => Math.abs(simTime - rt) < 0.2) : false;
      detectorLight.setAttribute("fill", recent ? "#ff5252" : "#999");
    }

    // Manage state transitions: if injecting and first peak not yet started, set RUNNING when near first peak
    if (injectionEvent && currentState !== HPLC_STATES.RUNNING) {
      const nextPeak = Math.min(...injectionEvent.peakRTs);
      if (simTime >= nextPeak - 0.05) { // shortly before peak
        setState(HPLC_STATES.RUNNING);
      }
    }

    // End run at MAX_TIME
    if (simTime >= MAX_TIME) {
      setState(HPLC_STATES.COMPLETED);
      stopLoop();
    }
  }

  /* ===== Start authoritative loop ===== */
  function startLoop() {
    if (timerId) return; // already running
    timerId = setInterval(runTick, DT * 60 * 1000 / 1); // scale: DT minutes -> milliseconds
    // Note: we use setInterval with converted ms; for small projects this is fine.
  }

  /* ===== Stop authoritative loop ===== */
  function stopLoop() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  /* ===== Public operations (bound to buttons) ===== */
  function startPump() {
    // Pump start: reset simTime and graph for a fresh run
    simTime = 0;
    resetGraph();
    injectionEvent = null;
    setState(HPLC_STATES.PUMPING);
    // start loop and begin equilibration -> READY
    startLoop();

    // Simulated equilibration delay (2 s real ~ 2 sec)
    setTimeout(() => {
      if (currentState === HPLC_STATES.PUMPING) {
        setState(HPLC_STATES.READY);
      }
    }, 2000);
  }

  function stopPump() {
    stopLoop();
    setState(HPLC_STATES.STOPPED);
    // Keep graph as-is; user can restart pump to run again (not auto-clear)
  }

  function injectSample() {
    if (currentState !== HPLC_STATES.READY) return;

    // Determine selected sample
    const key = compoundSelect?.value;
    let sampleArray = null;
    if (key && typeof SAMPLES !== "undefined") {
      // Allow both single and mixture where SAMPLES[key] may be an array
      const maybe = SAMPLES[key];
      if (Array.isArray(maybe)) sampleArray = maybe;
      else if (maybe && maybe.length === undefined && maybe.name) sampleArray = [maybe];
    }

    if (!sampleArray || sampleArray.length === 0) {
      // fallback to a single default compound
      sampleArray = [SAMPLES?.caffeine || { name: "Caffeine", hydrophobicity: 0.55, height: 1.0 }];
    }

    // Compute peak RTs relative to current simTime using HPLC_ENGINE
    const peakRTs = computePeakRTsForSample(sampleArray);

    injectionEvent = {
      time: simTime,
      compounds: sampleArray,
      peakRTs: peakRTs
    };

    // Show estimated RT for the first compound
    const firstRT = peakRTs.length ? peakRTs[0] : (simTime + 1.0);
    if (rtDisplay) rtDisplay.textContent = `Estimated RT (first): ${firstRT.toFixed(2)} min`;

    setState(HPLC_STATES.INJECTED);

    // After injection we continue acquisition (loop already running)
    // When simulation time reaches first peak the state will move to RUNNING inside runTick()
  }

  /* ===== UI wiring (safe because DOMContentLoaded) ===== */

  // init chart
  initGraph();

  // Hook diagram elements after SVG loaded
  setTimeout(() => {
    pumpBox = document.getElementById("pumpBox");
    injectorBox = document.getElementById("injectorBox");
    detectorLight = document.getElementById("detectorLight");
    tubes = document.querySelectorAll(".tube");
  }, 600);

  // Controls: update local parameters and display labels
  if (flowInput) {
    flowInput.addEventListener("input", () => {
      flowRate = Number(flowInput.value);
      if (flowVal) flowVal.textContent = flowRate.toFixed(1);
    });
  }

  if (organicInput) {
    organicInput.addEventListener("input", () => {
      organicPercent = Number(organicInput.value);
      if (organicVal) organicVal.textContent = `${organicPercent}%`;
    });
  }

  if (sensitivityInput) {
    sensitivityInput.addEventListener("input", () => {
      sensitivity = Number(sensitivityInput.value);
      if (sensitivityVal) sensitivityVal.textContent = sensitivity.toFixed(1);
    });
  }

  if (compoundSelect) {
    // set currentSample reference (SAMPLES mapping)
    compoundSelect.addEventListener("change", () => {
      const key = compoundSelect.value;
      if (typeof SAMPLES !== "undefined" && SAMPLES[key]) {
        // SAMPLES may provide either a single compound object or an array (mixture)
        const maybe = SAMPLES[key];
        if (Array.isArray(maybe)) currentSample = maybe;
        else currentSample = [maybe];
      } else {
        currentSample = null;
      }

      // Update RT preview for first compound if pump is running and ready
      if (currentState === HPLC_STATES.READY && currentSample && currentSample.length) {
        const previewRT = computePeakRTsForSample(currentSample)[0] || (simTime + 1.0);
        if (rtDisplay) rtDisplay.textContent = `Estimated RT (first): ${previewRT.toFixed(2)} min`;
      }
    });

    // trigger initial selection
    compoundSelect.dispatchEvent(new Event('change'));
  }

  /* Buttons: pump and inject */
  if (pumpBtn) {
    pumpBtn.addEventListener("click", () => {
      const running = pumpBtn.textContent.includes("STOP");
      if (running) {
        // stop pump
        pumpBtn.textContent = "Pump START";
        stopPump();
      } else {
        // start pump
        pumpBtn.textContent = "Pump STOP";
        // start fresh run
        startPump();
      }
    });
  }

  if (injectBtn) {
    injectBtn.addEventListener("click", () => {
      injectSample();
    });
  }

  /* Initial state */
  setState(HPLC_STATES.IDLE);

}); // end DOMContentLoaded
