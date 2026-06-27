import { SAMPLES } from './samples.js';
import { getDeadTime, getRetentionFactor, getPeakSigma, getBaselineNoise, getSystemPressure } from './hplc.math.js';

async function injectDiagramSVG() {
  const container = document.getElementById("diagramContainer");
  try {
    const response = await fetch("./hplc.diagram.svg");
    if (!response.ok) throw new Error("Network response was not ok");
    container.innerHTML = await response.text();
  } catch (error) {
    container.textContent = "Diagram unavailable. Check connection or file path.";
    console.error("SVG Load Error:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {

  /* ========= STATES ========= */
  const STATES = {
    IDLE:      "INITIALIZING...",
    READY:     "READY FOR INJECTION",
    PUMPING:   "PUMPING",
    RUNNING:   "RUNNING",
    COMPLETED: "COMPLETED",
    STOPPED:   "STOPPED"
  };

  let state = STATES.IDLE;

  /* ========= DOM ========= */
  const statusEl        = document.getElementById("status");
  const pumpBtn         = document.getElementById("pumpBtn");
  const injectBtn       = document.getElementById("injectBtn");
  const rtDisplay       = document.getElementById("rtDisplay");
  const canvas          = document.getElementById("graphCanvas");

  const flowInput       = document.getElementById("flowInput");
  const flowVal         = document.getElementById("flowVal");
  const organicInput    = document.getElementById("organicInput");
  const organicVal      = document.getElementById("organicVal");
  const compoundSelect  = document.getElementById("compoundSelect");
  const sensitivityInput= document.getElementById("sensitivityInput");
  const sensitivityVal  = document.getElementById("sensitivityVal");
  const speedInput      = document.getElementById("speedInput");
  const speedVal        = document.getElementById("speedVal");
  
  // NEW DOM Elements
  const pressureMeter   = document.getElementById("pressureMeter");
  const pressureVal     = document.getElementById("pressureVal");
  const satWarning      = document.getElementById("satWarning");
  const pressureWarning = document.getElementById("pressureWarning");

  /* ========= STATE HANDLER ========= */
  function setState(s) {
    state = s;

    statusEl.textContent = s;
    const badge = statusEl;
    badge.className = "status-badge";
    
    let key = s.toLowerCase().replace(/[^a-z]/g, "");
    if (key.includes("ready")) key = "ready";
    if (key.includes("initializing")) key = "pumping"; 
    badge.classList.add(key);

    const lock = (s !== STATES.READY && s !== STATES.STOPPED && s !== STATES.COMPLETED);
    flowInput.disabled       = lock;
    organicInput.disabled    = lock;
    compoundSelect.disabled  = lock;
    sensitivityInput.disabled = lock;

    injectBtn.disabled = s !== STATES.READY;
    pumpBtn.disabled   = s === STATES.IDLE; 
    pumpBtn.textContent = (s === STATES.READY || s === STATES.STOPPED || s === STATES.COMPLETED)
      ? "▶ Pump START"
      : "⏹ Pump STOP";
      
    // Clear warnings when restarting or preparing
    if (s === STATES.READY || s === STATES.IDLE || s === STATES.PUMPING) {
      satWarning.style.display = "none";
      pressureWarning.style.display = "none";
    }
  }

  /* ========= HARDWARE PHYSICS HANDLER ========= */
  function updatePressure() {
    const pressure = getSystemPressure(getFlow(), getOrganic());
    pressureMeter.value = pressure;
    pressureVal.textContent = Math.round(pressure) + " bar";
    
    // UI Feedback styling for the text
    if (pressure > 350) pressureVal.style.color = "#b71c1c";
    else if (pressure > 250) pressureVal.style.color = "#f57f17";
    else pressureVal.style.color = "#2e7d32";
    
    return pressure;
  }

  /* ========= SLIDER DISPLAY SYNC ========= */
  flowInput.addEventListener("input", () => {
    flowVal.textContent = Number(flowInput.value).toFixed(1);
    updatePressure();
  });
  
  organicInput.addEventListener("input", () => {
    organicVal.textContent = organicInput.value + "%";
    updatePressure();
  });
  
  sensitivityInput.addEventListener("input", () => sensitivityVal.textContent = Number(sensitivityInput.value).toFixed(1));
  speedInput.addEventListener("input", () => {
    timeScale = Number(speedInput.value);
    speedVal.textContent = timeScale + "×";
  });

  /* ========= SIM CLOCK ========= */
  let t         = 0;
  const DT      = 0.01;
  let timeScale = Number(speedInput.value);
  const T_MAX   = 10;
  let timer     = null;

  /* ========= DETECTOR RANGE ========= */
  const Y_MIN = -0.2;
  const Y_MAX = 2.6; // Bumped up slightly to see the flat-topping at 2.5

  /* ========= CHART ========= */
  const chart = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      datasets: [{
        label: "UV Response",
        data: [],
        borderColor: "#1565c0",
        borderWidth: 2,
        pointRadius: 0,
        fill: { target: "origin", above: "rgba(21,101,192,0.07)" }
      }]
    },
    options: {
      animation: false,
      parsing: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `AU: ${ctx.parsed.y.toFixed(4)}` } } },
      scales: {
        x: { type: "linear", min: 0, max: T_MAX, title: { display: true, text: "Time (min)", font: { weight: "bold" } }, grid: { color: "#f0f0f0" } },
        y: { min: Y_MIN, max: Y_MAX, title: { display: true, text: "Response (AU)", font: { weight: "bold" } }, grid: { color: "#f0f0f0" } }
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
    rtDisplay.textContent = "Estimated RT: —";
  }

  /* ========= CHEMISTRY HOOKUPS ========= */
  function getFlow()        { return Number(flowInput.value); }
  function getOrganic()     { return Number(organicInput.value); }
  function getSensitivity() { return Number(sensitivityInput.value); }

  function calculateTrueRT(kw, S) {
    const flow = getFlow();
    const k = getRetentionFactor(kw, S, getOrganic());
    const t0 = getDeadTime(flow);
    return t0 * (1 + k);
  }

  function getPeaks() {
    const sel = compoundSelect.value;
    const flow = getFlow();
    let keys = sel === "mixture" ? ["paracetamol", "caffeine", "aspirin", "ibuprofen"] : [sel];
    
    return keys.map(key => {
      const comp = SAMPLES[key];
      const rt   = calculateTrueRT(comp.kw, comp.S);
      const sigma = getPeakSigma(rt, flow); 
      return { rt, height: comp.height, sigma };
    });
  }

  let peaks = null;

  /* ========= SVG DOT ANIMATION ========= */
  let flowInterval = null, sampleInterval = null;

  function initDotAnimation() {
    const svgEl = document.querySelector("#diagramContainer svg");
    if (!svgEl) return;
    
    const flowPath = svgEl.getElementById("flowPath"), 
          flowDot = svgEl.getElementById("flowDot"), 
          sampleDot = svgEl.getElementById("sampleDot");
          
    if (!flowPath || !flowDot || !sampleDot) return;
    const pathLen = flowPath.getTotalLength();

    function moveDot(dot, speed, loop, onDone) {
      let pos = 0; dot.style.opacity = 1;
      return setInterval(() => {
        pos += speed;
        if (pos > pathLen) {
          if (loop) pos = 0;
          else { dot.style.opacity = 0; clearInterval(sampleInterval); sampleInterval = null; if (onDone) onDone(); return; }
        }
        const pt = flowPath.getPointAtLength(pos);
        dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y);
      }, 30);
    }

    if (flowInterval) clearInterval(flowInterval);
    flowDot.style.opacity = 0;
    flowInterval = moveDot(flowDot, getFlow() * 2.5, true, null);

    window._injectSampleDot = () => {
      if (sampleInterval) clearInterval(sampleInterval);
      sampleInterval = moveDot(sampleDot, getFlow() * 1.8, false, null);
    };
  }

  function stopDotAnimation() {
    if (flowInterval)  { clearInterval(flowInterval);  flowInterval  = null; }
    if (sampleInterval){ clearInterval(sampleInterval); sampleInterval = null; }
    const svgEl = document.querySelector("#diagramContainer svg");
    if (svgEl) {
      const fd = svgEl.getElementById("flowDot"), sd = svgEl.getElementById("sampleDot");
      if (fd) fd.style.opacity = 0; if (sd) sd.style.opacity = 0;
    }
  }

  /* ========= MAIN LOOP ========= */
  function tick() {
    // 1. HARDWARE SAFETY CHECK
    const currentPressure = updatePressure();
    if (currentPressure > 400) {
      stop();
      setState(STATES.STOPPED);
      pressureWarning.style.display = "inline-block";
      pressureWarning.classList.add("pulse-warning");
      return; // Abort simulation tick
    }

    t += DT * timeScale;
    const flow = getFlow();
    const sens = getSensitivity();
    
    // 2. BASELINE & VOID VOLUME
    let y = getBaselineNoise(t, sens);
    const t0 = getDeadTime(flow);
    const t0Diff = Math.abs(t - t0);
    if (t > 0.1 && t0Diff < 0.3) {
       y += (Math.sin(t0Diff * 50) * 0.05 * sens) * Math.exp(-(t0Diff * t0Diff) / 0.01);
    }

    // 3. COMPOUND PEAKS
    if (peaks !== null) {
      peaks.forEach(pk => {
        const diff = t - pk.rt;
        if (Math.abs(diff) < 6 * pk.sigma) {
          y += pk.height * sens * Math.exp(-(diff * diff) / (2 * pk.sigma * pk.sigma));
          if (state !== STATES.RUNNING) setState(STATES.RUNNING);
        }
      });
    }

    // 4. DETECTOR SATURATION CLIPPING
    let isSaturated = false;
    const DETECTOR_LIMIT = 2.5;
    if (y > DETECTOR_LIMIT) {
      y = DETECTOR_LIMIT;
      isSaturated = true;
    }
    
    // Toggle warning UI without overriding other states aggressively
    if (isSaturated && state === STATES.RUNNING) {
      satWarning.style.display = "inline-block";
      satWarning.classList.add("pulse-warning");
    } else if (!isSaturated && satWarning.style.display !== "none") {
      satWarning.style.display = "none";
      satWarning.classList.remove("pulse-warning");
    }

    addPoint(t, y);
    if (t >= T_MAX) { stop(); setState(STATES.COMPLETED); }
  }

  function start() {
    resetRun(); 
    peaks = null; 
    
    // Validate pressure before starting
    if (updatePressure() > 400) {
      pressureWarning.style.display = "inline-block";
      pressureWarning.classList.add("pulse-warning");
      return; 
    }
    
    setState(STATES.PUMPING);
    timer = setInterval(tick, 200);
    initDotAnimation();
    setState(STATES.READY);
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    stopDotAnimation();
  }

  function showRTSummary(peakList) {
    if (peakList.length === 1) {
      rtDisplay.textContent = `Estimated RT: ${peakList[0].rt.toFixed(2)} min`;
    } else {
      const names = ["Paracetamol", "Caffeine", "Aspirin", "Ibuprofen"];
      rtDisplay.innerHTML = peakList.map((pk, i) => `${names[i]}: <b>${pk.rt.toFixed(2)} min</b>`).join(" &nbsp;|&nbsp; ");
    }
  }

  pumpBtn.onclick = () => { if (timer) { stop(); setState(STATES.STOPPED); } else start(); };
  injectBtn.onclick = () => {
    if (state !== STATES.READY) return;
    peaks = getPeaks();
    showRTSummary(peaks);
    if (window._injectSampleDot) window._injectSampleDot();
  };

  // INITIALIZATION SEQUENCE
  setState(STATES.IDLE);
  updatePressure(); // Set initial gauge state
  
  await injectDiagramSVG();
  setState(STATES.READY);
});
