// src/context/OnboardingContext.jsx
import { createContext, useContext, useState } from "react";

const OnboardingContext = createContext(null);

const INITIAL_STATE = {
  goal: null, // "lose" | "maintain" | "gain"
  macroMode: "auto", // "auto" | "manual"
  manualMacros: {
    protein: "",
    carbs: "",
    fats: "",
  },

  dietaryPreferences: [], // e.g. ["vegan", "mediterranean"]
  allergies: [], // e.g. ["peanuts", "shellfish"]
  eatingStyles: [], // e.g. ["meal-prep", "leftovers"]
  spiceLevel: null, // e.g. "mild" | "medium" | "spicy"
  flavorProfiles: [], // e.g. ["savory", "fresh", "bold"]
  planReady: false,
};

export function OnboardingProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE);

  function setGoal(goal) {
    setState((prev) => ({ ...prev, goal }));
  }

  function setMacroMode(mode) {
    setState((prev) => ({ ...prev, macroMode: mode }));
  }

  function setDietaryPreferences(prefs) {
    setState((prev) => ({ ...prev, dietaryPreferences: prefs }));
  }

  function setManualMacros(manualMacros) {
    setState((prev) => ({ ...prev, manualMacros }));
  }

  function setAllergies(allergies) {
    setState((prev) => ({ ...prev, allergies }));
  }

  function setEatingStyles(styles) {
    setState((prev) => ({ ...prev, eatingStyles: styles }));
  }

  function setSpiceLevel(level) {
    setState((prev) => ({ ...prev, spiceLevel: level }));
  }

  function setFlavorProfiles(profiles) {
    setState((prev) => ({ ...prev, flavorProfiles: profiles }));
  }

  function setPlanReady(planReady) {
    setState((prev) => ({ ...prev, planReady }));
  }

  function resetOnboarding() {
    setState(INITIAL_STATE);
  }

  const value = {
    state,
    setGoal,
    setMacroMode,
    setDietaryPreferences,
    setManualMacros,
    setAllergies,
    setEatingStyles,
    setSpiceLevel,
    setFlavorProfiles,
    setPlanReady,
    resetOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return ctx;
}
