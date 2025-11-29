// src/pages/EditPreferences/EditPreferences.jsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./EditPreferences.module.css";
import PreferenceGroup from "@/components/PreferenceGroup/PreferenceGroup";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";

// --- Option catalogs ---------------------------------

const DIET_TYPE_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "pesca-vegan", label: "Pesca-vegan" },
  { value: "plant-based", label: "Plant-based" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "gluten-free", label: "Gluten-free" },
  { value: "dairy-free", label: "Dairy-free" },
];

const ALLERGY_OPTIONS = [
  { value: "shellfish", label: "Shellfish" },
  { value: "peanuts", label: "Peanuts" },
  { value: "tree-nuts", label: "Tree nuts" },
  { value: "lactose", label: "Lactose" },
  { value: "gluten", label: "Gluten" },
  { value: "eggs", label: "Eggs" },
  { value: "fish", label: "Fish" },
  { value: "soy", label: "Soy" },
];

const CUISINE_OPTIONS = [
  { value: "halal", label: "Halal-friendly" },
  { value: "kosher", label: "Kosher-friendly" },
  { value: "asian-inspired", label: "Asian-inspired" },
  { value: "latin-american", label: "Latin American" },
  { value: "italian", label: "Italian" },
  { value: "soul-food", label: "Soul food" },
  { value: "indian", label: "Indian" },
  { value: "american", label: "American" },
  { value: "korean", label: "Korean" },
  { value: "island-inspired", label: "Island-inspired" },
];

const FLAVOR_OPTIONS = [
  { value: "sweet", label: "Sweet" },
  { value: "savory", label: "Savory" },
  { value: "umami", label: "Umami" },
  { value: "tangy", label: "Tangy" },
  { value: "smoky", label: "Smoky" },
  { value: "creamy", label: "Creamy" },
];

const SPICE_OPTIONS = [
  { value: "mild", label: "Mild" },
  { value: "medium", label: "Medium" },
  { value: "spicy", label: "Spicy" },
];

// --- Page component -----------------------------------

function EditPreferencesPage() {
  const navigate = useNavigate();

  // For now: mock “initial” state (later this will come from API)
  const initial = useMemo(
    () => ({
      dietTypes: ["pescatarian", "dairy-free"],
      allergies: [],
      cuisines: ["latin-american", "soul-food"],
      flavors: ["savory", "tangy"],
      spice: ["medium"], // single-select, but we still use an array
    }),
    []
  );

  const [dietTypes, setDietTypes] = useState(initial.dietTypes);
  const [allergies, setAllergies] = useState(initial.allergies);
  const [cuisines, setCuisines] = useState(initial.cuisines);
  const [flavors, setFlavors] = useState(initial.flavors);
  const [spice, setSpice] = useState(initial.spice);

  const current = { dietTypes, allergies, cuisines, flavors, spice };
  const isDirty =
    JSON.stringify(current) !== JSON.stringify(initial);

  function handleSave() {
    // 🔮 Future: call backend to persist preferences
    // For now we just log + go back
    console.log("Saving preferences (mock):", current);
    navigate(-1);
  }

  function handleCancel() {
    navigate(-1);
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className="h1">Dietary preferences</h1>
        <p className="caption">
          Tell MacroMunch how you like to eat. We’ll use this across your meal
          plan and recipe suggestions.
        </p>
      </header>

      <section className={styles.content}>
        <div className={styles.groups}>
          <PreferenceGroup
            title="Diet type"
            description="We’ll prioritize recipes that fit your core eating pattern."
            options={DIET_TYPE_OPTIONS}
            selectedValues={dietTypes}
            onChange={setDietTypes}
            allowMultiple={true}
            pillSize="md"
            defaultOpen={true}
          />

          <PreferenceGroup
            title="Allergies & sensitivities"
            description="We’ll avoid these ingredients in your plan."
            options={ALLERGY_OPTIONS}
            selectedValues={allergies}
            onChange={setAllergies}
            allowMultiple={true}
            pillSize="sm"
          />

          <PreferenceGroup
            title="Eating style"
            description="The cuisines and comfort foods that feel like you."
            options={CUISINE_OPTIONS}
            selectedValues={cuisines}
            onChange={setCuisines}
            allowMultiple={true}
            pillSize="sm"
          />

          <PreferenceGroup
            title="Flavor profile"
            description="We’ll lean into the flavors you reach for most."
            options={FLAVOR_OPTIONS}
            selectedValues={flavors}
            onChange={setFlavors}
            allowMultiple={true}
            pillSize="sm"
          />

          <PreferenceGroup
            title="Spice level"
            description="We’ll match recipes to your heat tolerance."
            options={SPICE_OPTIONS}
            selectedValues={spice}
            onChange={setSpice}
            allowMultiple={false} // single select
            pillSize="sm"
          />
        </div>

        <div className={styles.actions}>
          <PrimaryButton
            type="button"
            label={isDirty ? "Save changes" : "Saved"}
            disabled={!isDirty}
            onClick={handleSave}
          />
          <button
            type="button"
            className={`${styles.cancel} body-text`}
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </section>
    </main>
  );
}

export default EditPreferencesPage;