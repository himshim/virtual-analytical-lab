import { hplcState } from "./hplc.state.js";

let flowInterval = null;
let sampleInterval = null;

const path = document.getElementById("flowPath");
const flowDot = document.getElementById("flowDot");
const sampleDot = document.getElementById("sampleDot");

const pathLength = path.getTotalLength();

function moveDot(dot, speed, repeat = true) {
  let pos = 0;
  dot.style.opacity = 1;

  return setInterval(() => {
    pos += speed;
    if (pos > pathLength) {
      if (repeat) pos = 0;
      else {
        dot.style.opacity = 0;
        return;
      }
    }
    const point = path.getPointAtLength(pos);
    dot.setAttribute("cx", point.x);
    dot.setAttribute("cy", point.y);
  }, 30);
}

export function startFlowAnimation() {
  stopFlowAnimation();
  const speed = hplcState.flow * 2;   // realistic feel
  flowInterval = moveDot(flowDot, speed, true);
}

export function stopFlowAnimation() {
  if (flowInterval) clearInterval(flowInterval);
  flowDot.style.opacity = 0;
}

export function injectSampleAnimation() {
  if (sampleInterval) clearInterval(sampleInterval);
  const speed = hplcState.flow * 1.5;
  sampleInterval = moveDot(sampleDot, speed, false);
}