import { IGV_RATE } from "./constants.js";

/** Calculate IGV breakdown from a total amount (price inclusive of IGV) */
export function calcFromTotal(totalConIgv) {
  const valorVenta = round2(totalConIgv / (1 + IGV_RATE));
  const igv = round2(totalConIgv - valorVenta);
  return { valorVenta, igv, total: totalConIgv };
}

/** Calculate IGV from a base amount (price without IGV) */
export function calcFromBase(valorVenta) {
  const igv = round2(valorVenta * IGV_RATE);
  const total = round2(valorVenta + igv);
  return { valorVenta, igv, total };
}

/** Round to 2 decimal places */
export function round2(n) {
  return Math.round(n * 100) / 100;
}
