// src/lib/macroCalculator.js

/**
 * Compute smart macros using:
 * - Mifflin–St Jeor BMR
 * - Activity multiplier
 * - Goal adjustment
 * - 30% protein / 45% carbs / 25% fats
 */
export function computeSmartMacros({
  age,
  weightKg,
  heightCm,
  activity,   // "sedentary" | "lightly_active" | "moderately_active" | "very_active" | etc.
  sex,        // "female" | "male" | ...
  goal,       // "lose" | "maintain" | "gain"
}) {
  const ageYears = Number(age);
  const w = Number(weightKg);
  const h = Number(heightCm);

  if (!ageYears || !w || !h) {
    return null; // missing core data
  }

  const sexNorm = (sex || "female").toLowerCase();
  const isMale = sexNorm === "male";

  // 🔢 Mifflin–St Jeor BMR
  const bmr = isMale
    ? 10 * w + 6.25 * h - 5 * ageYears + 5
    : 10 * w + 6.25 * h - 5 * ageYears - 161;

  // 🏃 Activity multiplier
  const act = (activity || "lightly_active").toLowerCase();
  let multiplier = 1.375; // lightly active default

  switch (act) {
    case "sedentary":
      multiplier = 1.2;
      break;
    case "lightly_active":
      multiplier = 1.375;
      break;
    case "moderately_active":
      multiplier = 1.55;
      break;
    case "very_active":
      multiplier = 1.725;
      break;
    case "super_active":
    case "extra_active":
      multiplier = 1.9;
      break;
    default:
      multiplier = 1.375;
  }

  const tdee = bmr * multiplier;

  // 🎯 Goal adjustment
  const g = (goal || "maintain").toLowerCase();
  let adjusted = tdee;

  if (g === "lose") {
    adjusted = tdee - 400; // modest deficit
  } else if (g === "gain") {
    adjusted = tdee + 250; // small surplus
  }

  // Safety floor so we don't go wild-low
  if (adjusted < 1200) adjusted = 1200;

  // Round calories to nearest 10
  const kcal = Math.round(adjusted / 10) * 10;

  // 🧮 Macro split: 30% P / 45% C / 25% F
  const proteinKcal = kcal * 0.3;
  const carbsKcal = kcal * 0.45;
  const fatsKcal = kcal * 0.25;

  let proteinG = proteinKcal / 4;
  let carbsG = carbsKcal / 4;
  let fatsG = fatsKcal / 9;

  // Round to nearest 5g for prettier numbers
  const round5 = (x) => Math.round(x / 5) * 5;

  proteinG = round5(proteinG);
  carbsG = round5(carbsG);
  fatsG = round5(fatsG);

  return {
    kcal,
    proteinG,
    carbsG,
    fatsG,
  };
}