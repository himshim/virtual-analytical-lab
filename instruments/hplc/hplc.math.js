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
    const safeFlow = Math.max(flowRate, 0.01); // Prevent divide-by-zero
    return COLUMN_VOID_VOLUME / safeFlow;
}

/**
 * Calculates the Retention Factor (k) using the Linear Solvent Strength (LSS) model.
 * Formula: log(k) = log(kw) - S * phi
 * * @param {number} kw - Retention factor in 100% water (hydrophobicity factor)
 * @param {number} S - Solvent strength parameter (sensitivity to organic modifier)
 * @param {number} organicPercent - Mobile phase composition ratio (10 to 90)
 * @returns {number} Retention factor (k)
 */
export function getRetentionFactor(kw, S, organicPercent) {
    const phi = organicPercent / 100; // Convert to fraction (0 to 1)
    const log_k = Math.log10(kw) - (S * phi);
    return Math.pow(10, log_k);
}

/**
 * Calculates Peak Broadening (Sigma) using a simplified Van Deemter model.
 * Peaks achieve maximal sharpness at an optimal flow velocity (~1.0 mL/min).
 * Too slow = longitudinal diffusion broadening. 
 * Too fast = mass transfer broadening resistance.
 * * @param {number} tR - Retention time of the peak (min)
 * @param {number} flowRate - Volumetric flow rate (mL/min)
 * @returns {number} Sigma (standard deviation of the Gaussian distribution curve)
 */
export function getPeakSigma(tR, flowRate) {
    const safeFlow = Math.max(flowRate, 0.01);
    
    // Empirical coefficients for an abstract Van Deemter profile
    const A = 0.01;            // Eddy diffusion (packing variations)
    const B = 0.02 / safeFlow; // Longitudinal diffusion (worse at low flows)
    const C = 0.03 * safeFlow; // Mass transfer kinetics (worse at high flows)
    
    // Height Equivalent to a Theoretical Plate (H)
    const H = A + B + C; 
    
    // Column Efficiency / Theoretical Plates (N) 
    // Derived here as an inverse function of plate height scaled to standard ratios
    const N = 1 / H; 
    
    // Chromatographic Sigma transformation calculation
    return tR / Math.sqrt(N);
}

/**
 * Generates dynamic detector noise configurations, including low-frequency thermal baseline drift.
 * @param {number} time - Running operational time sequence marker
 * @param {number} sensitivity - Scaling multiplier dictated by UI settings
 * @returns {number} Absorbance baseline offset value in Absorbance Units (AU)
 */
export function getBaselineNoise(time, sensitivity) {
    // High-frequency random electronic background scatter
    const staticNoise = (Math.random() - 0.5) * 0.02;
    
    // Low-frequency cyclical drift tracking pump synchronization or thermal variance
    const drift = Math.sin(time * 0.5) * 0.01; 
    
    return (staticNoise + drift) * sensitivity;
}
