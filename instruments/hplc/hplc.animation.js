import { hplcState } from "./hplc.state.js";

let flowInterval = null;
let sampleInterval = null;

let path, flowDot, sampleDot, pathLength;

/* ✅ SAFE INIT AFTER SVG LOAD */
export function initAnimation() {
  path = document.getElementById("flowPath");
  flowDot = document.getElementById("flowDot");
  sampleDot = document.getElementById("sampleDot");

  if (!path) {
    console.warn("HPLC SVG not ready yet");
    return;
  }

  pathLength = path.getTotalLength();
}

/* INTERNAL */
function moveDot(dot, speed, loop = true) {
  let pos = 0;
  dot.style.opacity = 1;

  return setInterval(() => {
    pos += speed;

    if (pos > pathLength) {
      if (loop) pos = 0;
      else {
        dot.style.opacity = 0;
        clearInterval(sampleInterval);
      }
    }

    const p = path.getPointAtLength(pos);
    dot.setAttribute("cx", p.x);
    dot.setAttribute("cy", p.y);
  }, 30);
}

/* PUBLIC API */
export function startFlowAnimation() {
  if (!path) initAnimation();
  if (!path) return;

  stopFlowAnimation();
  flowInterval = moveDot(flowDot, hplcState.flow * 2);
}

export function stopFlowAnimation() {
  if (flowInterval) clearInterval(flowInterval);
  if (flowDot) flowDot.style.opacity = 0;
}

export function injectSampleAnimation() {
  if (!path) initAnimation();
  if (!path) return;

  sampleInterval = moveDot(sampleDot, hplcState.flow * 1.5, false);
}