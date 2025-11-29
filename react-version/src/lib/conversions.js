// src/lib/conversions.js

// Convert pounds → kilograms
export const lbsToKg = (lbs) =>
  Number((Number(lbs) * 0.45359237).toFixed(2));

// Convert feet + inches → centimeters
export const ftInToCm = (feet, inches) =>
  Math.round(((Number(feet) * 12 + Number(inches)) * 2.54));