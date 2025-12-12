// src/lib/conversions.js

// Convert pounds → kilograms
export const lbsToKg = (lbs) =>
  Number((Number(lbs) * 0.45359237).toFixed(2));

// Convert kilograms → pounds
export const kgToLbs = (kg) => {
  const n = Number(kg);
  if (Number.isNaN(n)) return 0;
  return Number((n / 0.45359237).toFixed(1)); // e.g. 152.4 → 152.4
};

// Convert feet + inches → centimeters
export const ftInToCm = (feet, inches) =>
  Math.round(((Number(feet) * 12 + Number(inches)) * 2.54));

// Convert centimeters → feet + inches
export const cmToFtIn = (cm) => {
  const n = Number(cm);
  if (Number.isNaN(n)) return { feet: 0, inches: 0 };

  const totalIn = n / 2.54;
  const feet = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn - feet * 12);

  return { feet, inches };
};