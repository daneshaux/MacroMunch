// src/pages/EditPreferences/EditPreferences.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./EditPreferences.module.css";
import PreferenceGroup from "@/components/PreferenceGroup/PreferenceGroup";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";

import {
  getCurrentUserProfile,
  updateCurrentUserProfile,
  markPlanStale,
} from "@/lib/userApi";

// ... your option arrays stay the same

function EditPreferencesPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // “initial” snapshot from DB so isDirty works correctly
  const [initial, setInitial] = useState(null);

  const [dietTypes, setDietTypes] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [flavors, setFlavors] = useState([]);
  const [spice, setSpice] = useState([]); // still array for your PreferenceGroup

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError("");

      const res = await getCurrentUserProfile();
      if (!mounted) return;

      if (!res.ok || !res.data) {
        setError(res.error || "Could not load your preferences.");
        setInitial({
          dietTypes: [],
          allergies: [],
          cuisines: [],
          flavors: [],
          spice: [],
        });
        setLoading(false);
        return;
      }

      const p = res.data;

      const dbInitial = {
        dietTypes: Array.isArray(p.diet_preferences) ? p.diet_preferences : [],
        allergies: Array.isArray(p.diet_allergies) ? p.diet_allergies : [],
        cuisines: Array.isArray(p.diet_eating_styles) ? p.diet_eating_styles : [],
        flavors: Array.isArray(p.diet_flavor_profiles) ? p.diet_flavor_profiles : [],
        spice: p.diet_spice_level ? [p.diet_spice_level] : [],
      };

      setInitial(dbInitial);

      setDietTypes(dbInitial.dietTypes);
      setAllergies(dbInitial.allergies);
      setCuisines(dbInitial.cuisines);
      setFlavors(dbInitial.flavors);
      setSpice(dbInitial.spice);

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const current = useMemo(
    () => ({ dietTypes, allergies, cuisines, flavors, spice }),
    [dietTypes, allergies, cuisines, flavors, spice]
  );

  const isDirty =
    initial && JSON.stringify(current) !== JSON.stringify(initial);

  async function handleSave() {
    if (!isDirty) {
      navigate(-1);
      return;
    }

    setSaving(true);
    setError("");

    const patch = {
      diet_preferences: dietTypes,
      diet_allergies: allergies,
      diet_eating_styles: cuisines,
      diet_flavor_profiles: flavors,
      diet_spice_level: spice?.[0] || null,
    };

    const res = await updateCurrentUserProfile(patch);

    if (!res.ok) {
      setSaving(false);
      setError(res.error || "Could not save preferences.");
      return;
    }

    // ✅ mark plan stale (don’t regenerate yet)
    await markPlanStale("Dietary preferences updated");

    setSaving(false);
    navigate("/profile");
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
        {loading ? (
          <p className="caption">Loading your preferences…</p>
        ) : (
          <>
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
                onChange={(arr) => {
                  // single select: PreferenceGroup may send array; keep only 1
                  setSpice(arr?.length ? [arr[arr.length - 1]] : []);
                }}
                allowMultiple={false}
                pillSize="sm"
              />
            </div>

            {error && <p className="caption">{error}</p>}

            <div className={styles.actions}>
              <PrimaryButton
                type="button"
                label={saving ? "Saving…" : isDirty ? "Save changes" : "Saved"}
                disabled={!isDirty || saving}
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
          </>
        )}
      </section>
    </main>
  );
}

export default EditPreferencesPage;