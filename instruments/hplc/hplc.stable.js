document.addEventListener("DOMContentLoaded", () => {

  /* ========= STATES ========= */
  const STATES = {
    IDLE:      "IDLE",
    PUMPING:   "PUMPING",
    READY:     "READY FOR INJECTION",
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

  /* ========= STATE HANDLER ========= */
  function setState(s) {
    state = s;

    // Text
    statusEl.textContent = s;

    // Badge colour class
    const badge = statusEl;
    badge.className = "status-badge";
    const key = s.toLowerCase().replace(/\s+/g, "").replace("forinjection", "");
    badge.classList.add(key);

    const lock = s !== STATES.IDLE;
    flowInput.disabled       = lock;
    organicInput.disabled    = lock;
    compoundSelect.disabled  = lock;
    sensitivityInput.disabled = lock;

    injectBtn.disabled = s !== STATES.READY;
    pumpBtn.textContent = (s === STATES.IDLE || s === STATES.STOPPED || s === STATES.COMPLETED)
      ? "▶ Pump START"
      : "⏹ Pump STOP";
  }

  /* ========= SLIDER DISPLAY SYNC ========= */
  // BUG FIX: these listeners were missing — sliders showed stale values
  flowInput.addEventListener("input", () => {
    flowVal.textContent = Number(flowInput.value).toFixed(1);
  });

  organicInput.addEventListener("input", () => {
    organicVal.textContent = organicInput.value + "%";
  });

  sensitivityInput.addEventListener("input", () => {
    sensitivityVal.textContent = Number(sensitivityInput.value).toFixed(1);
  });

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
  const Y_MAX = 2.2;

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
        fill: {
          target: "origin",
          above: "rgba(21,101,192,0.07)"
        }
      }]
    },
    options: {
      animation: false,
      parsing: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `AU: ${ctx.parsed.y.toFixed(4)}`
          }
        }
      },
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: T_MAX,
          title: { display: true, text: "Time (min)", font: { weight: "bold" } },
          grid: { color: "#f0f0f0" }
        },
        y: {
          min: Y_MIN,
          max: Y_MAX,
          title: { display: true, text: "Response (AU)", font: { weight: "bold" } },
          grid: { color: "#f0f0f0" }
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
    rtDisplay.textContent = "Estimated RT: —";
  }

  /* ========= CHEMISTRY ========= */
  function getFlow()        { return Number(flowInput.value); }
  function getOrganic()     { return Number(organicInput.value); }
  function getSensitivity() { return Number(sensitivityInput.value); }

  function elutionStrength(org) {
    return 0.3 + 0.7 * (org / 100);
  }

  function calcRT(hydrophobicity) {
    return 1 + hydrophobicity / (getFlow() * elutionStrength(getOrganic()));
  }

  // Returns array of {rt, height, sigma} for selected compound(s)
  function getPeaks() {
    const sel = compoundSelect.value;

    if (sel === "mixture") {
      return ["paracetamol", "caffeine", "aspirin", "ibuprofen"].map(key => {
        const comp = SAMPLES[key];
        const rt   = calcRT(comp.hydrophobicity);
        return { rt, height: comp.height, sigma: rt * 0.04 };
      });
    }

    const comp = SAMPLES[sel];
    const rt   = calcRT(comp.hydrophobicity);
    return [{ rt, height: comp.height, sigma: rt * 0.04 }];
  }

  let peaks = null;  // set on inject

  function baselineNoise() {
    return (Math.random() - 0.5) * 0.03 * getSensitivity();
  }

  /* ========= SVG DOT ANIMATION ========= */
  let flowInterval  = null;
  let sampleInterval = null;

  function initDotAnimation() {
    const svgEl = document.querySelector("#diagramContainer svg");
    if (!svgEl) return;

    const flowPath  = svgEl.getElementById("flowPath");
    const flowDot   = svgEl.getElementById("flowDot");
    const sampleDot = svgEl.getElementById("sampleDot");

    if (!flowPath || !flowDot || !sampleDot) return;

    const pathLen = flowPath.getTotalLength();

    function moveDot(dot, speed, loop, onDone) {
      let pos = 0;
      dot.style.opacity = 1;
      return setInterval(() => {
        pos += speed;
        if (pos > pathLen) {
          if (loop) {
            pos = 0;
          } else {
            dot.style.opacity = 0;
            clearInterval(sampleInterval);
            sampleInterval = null;
            if (onDone) onDone();
            return;
          }
        }
        const pt = flowPath.getPointAtLength(pos);
        dot.setAttribute("cx", pt.x);
        dot.setAttribute("cy", pt.y);
      }, 30);
    }

    // Start continuous flow dot
    if (flowInterval) clearInterval(flowInterval);
    flowDot.style.opacity = 0;
    flowInterval = moveDot(flowDot, getFlow() * 2.5, true, null);

    // Expose inject animation
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
      const fd = svgEl.getElementById("flowDot");
      const sd = svgEl.getElementById("sampleDot");
      if (fd) fd.style.opacity = 0;
      if (sd) sd.style.opacity = 0;
    }
  }

  /* ========= MAIN LOOP ========= */
  function tick() {
    t += DT * timeScale;

    let y = baselineNoise();

    if (peaks !== null) {
      peaks.forEach(pk => {
        const diff = t - pk.rt;
        if (Math.abs(diff) < 6 * pk.sigma) {
          y += pk.height * getSensitivity() *
               Math.exp(-(diff * diff) / (2 * pk.sigma * pk.sigma));
          if (state !== STATES.RUNNING) setState(STATES.RUNNING);
        }
      });
    }

    addPoint(t, y);

    if (t >= T_MAX) {
      stop();
      setState(STATES.COMPLETED);
    }
  }

  function start() {
    resetRun();
    peaks = null;
    setState(STATES.PUMPING);

    timer = setInterval(tick, 200);

    // Load SVG then start dot animation
    setTimeout(() => {
      initDotAnimation();
      if (state === STATES.PUMPING) setState(STATES.READY);
    }, 600);
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    stopDotAnimation();
  }

  /* ========= RT SUMMARY ========= */
  function showRTSummary(peakList) {
    if (peakList.length === 1) {
      rtDisplay.textContent = `Estimated RT: ${peakList[0].rt.toFixed(2)} min`;
    } else {
      const names = ["Paracetamol", "Caffeine", "Aspirin", "Ibuprofen"];
      rtDisplay.innerHTML = peakList
        .map((pk, i) => `${names[i]}: <b>${pk.rt.toFixed(2)} min</b>`)
        .join(" &nbsp;|&nbsp; ");
    }
  }

  /* ========= BUTTONS ========= */
  pumpBtn.onclick = () => {
    if (timer) {
      stop();
      setState(STATES.STOPPED);
    } else {
      start();
    }
  };

  injectBtn.onclick = () => {
    if (state !== STATES.READY) return;
    peaks = getPeaks();
    showRTSummary(peaks);
    if (window._injectSampleDot) window._injectSampleDot();
  };

  /* ========= INIT ========= */
  setState(STATES.IDLE);

});
