/**
 * hplc.math.js - Core Physics and Chemistry Engine
 * * Simulates a standard C18 Reversed-Phase Column
 * Dimensions: 150 mm length x 4.6 mm ID, 5 µm particles
 */

// Approximate column void volume (V0) in mL for a standard 150x4.6mm column
const COLUMN_VOID_VOLUME = 1.5; 

/**
 * Calculates Column Dead Time (t0) based on Flow Rate.
 * t0 is the time it takes for an unretained molecule to pass through the column volume.
 * @param {number} flowRate - mL/min
 * @returns {number} t0 in minutes
 */
export function getDeadTime(flowRate) {
    const safeFlow = Math.max(flowRate, 0.01); 
    return COLUMN_VOID_VOLUME / safeFlow;
}

/**
 * Calculates the Retention Factor (k) using the Linear Solvent Strength (LSS) model.
 */
export function getRetentionFactor(kw, S, organicPercent) {
    const phi = organicPercent / 100; 
    const log_k = Math.log10(kw) - (S * phi);
    return Math.pow(10, log_k);
}

/**
 * Calculates Peak Broadening (Sigma) using a simplified Van Deemter model.
 */
export function getPeakSigma(tR, flowRate) {
    const safeFlow = Math.max(flowRate, 0.01);
    
    const A = 0.01;            
    const B = 0.02 / safeFlow; 
    const C = 0.03 * safeFlow; 
    
    const H = A + B + C; 
    const N = 1 / H; 
    
    return tR / Math.sqrt(N);
}

/**
 * Generates dynamic detector noise configurations, including low-frequency thermal baseline drift.
 */
export function getBaselineNoise(time, sensitivity) {
    const staticNoise = (Math.random() - 0.5) * 0.02;
    const drift = Math.sin(time * 0.5) * 0.01; 
    return (staticNoise + drift) * sensitivity;
}

/**
 * NEW: Calculates Physical System Back-Pressure (in bar)
 * Mimics the non-linear viscosity of a water/methanol mixture where 
 * maximum viscosity (and thus maximum pressure) occurs around 50% organic.
 * * @param {number} flowRate - mL/min
 * @param {number} organicPercent - 0 to 100
 * @returns {number} System Pressure in bar
 */
export function getSystemPressure(flowRate, organicPercent) {
    const phi = organicPercent / 100;
    
    // Viscosity curve: peaks in the middle (~0.5) and is lower at the extremes (0 or 1)
    // Pure water = ~1.0 cP, Pure Methanol = ~0.6 cP, 50/50 mix = ~1.6 cP
    const viscosityBump = Math.sin(phi * Math.PI) * 0.8; // creates a bulge in the middle
    const baseViscosity = 1.0 - (0.4 * phi); // linear drop from water to pure solvent
    const totalViscosity = baseViscosity + viscosityBump;
    
    // Physical column flow resistance constant (empirically chosen for realistic UI numbers)
    const columnResistance = 120; 
    
    // Pressure = Flow × Viscosity × Resistance
    return flowRate * totalViscosity * columnResistance;
}
