// our UI: 'sedentary' | 'light' | 'moderate' | 'very'
// API:    'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active'
export function mapActivity(ui) {
    const map = {
      sedentary: "sedentary",
      light: "lightly_active",
      moderate: "moderately_active",
      very: "very_active",
    };
    return map[ui] || "sedentary";
  }
  
  // our UI: 'female' | 'male' | 'nonbinary' | 'prefer-not'
  // API requires: 'female' | 'male'
  export function mapSexForApi(ui) {
    if (ui === "female" || ui === "male") return ui;
    // MVP: ask user to choose one for calculation later; default to 'female' for now or block
    return "female";
  }
  
  export function dobToAge(year, month, day) {
    const today = new Date();
    const b = new Date(Number(year), Number(month) - 1, Number(day));
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
    return Math.max(0, age);
  }  