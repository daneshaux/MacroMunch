// src/pages/CreateAccount/CreateAccount.jsx
import { useEffect, useState } from "react";
import styles from "./CreateAccount.module.css";

import TextInput from "@/components/TextInput/TextInput";
import Select from "@/components/Select/Select";
import FormSection from "@/components/FormSection/FormSection";
import FieldRow from "@/components/FieldRow/FieldRow";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import HeightInput from "@/components/HeightInput/HeightInput";
import PasswordInput from "@/components/PasswordInput/PasswordInput";
import ActivityLevel from "@/components/ActivityLevel/ActivityLevel";

import { signUpWithPassword } from "@/lib/auth";
import { lbsToKg, ftInToCm } from "@/lib/conversions";
import { createUserProfile } from "@/lib/userApi";

// --- static data ---
const genders = [
  { value: "", label: "Select gender" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "nonbinary", label: "Non-binary" },
  { value: "prefer-not", label: "Prefer not to say" },
];

const months = [
  { value: "1", label: "Jan" }, { value: "2", label: "Feb" }, { value: "3", label: "Mar" },
  { value: "4", label: "Apr" }, { value: "5", label: "May" }, { value: "6", label: "Jun" },
  { value: "7", label: "Jul" }, { value: "8", label: "Aug" }, { value: "9", label: "Sep" },
  { value: "10", label: "Oct" }, { value: "11", label: "Nov" }, { value: "12", label: "Dec" },
];

const days = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => {
  const y = String(currentYear - i);
  return { value: y, label: y };
});

// --- component ---
function CreateAccount({
  initialEmail = "",
  session,                    // currently not used here, but fine to keep
  onCreated = () => {},
  onNeedEmailConfirm = () => {},
}) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  // Step 1 fields (Account)
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Step 2 fields (Personal)
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [activity, setActivity] = useState("");
  const [gender, setGender] = useState("");

  // Keep email in sync when you arrive from WelcomePage
  useEffect(() => {
    setEmail(initialEmail || "");
  }, [initialEmail]);

  function validateStep1() {
    if (!first?.trim()) return "Please enter your first name.";
    if (!last?.trim()) return "Please enter your last name.";
    if (!email?.trim()) return "Please enter your email.";
    if (!password) return "Please create a password.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (confirm !== password) return "Passwords do not match.";
    return "";
  }

  function validateStep2() {
    if (!dobMonth || !dobDay || !dobYear) return "Please enter your date of birth.";
    if (!weightLbs) return "Please enter your weight (lbs).";
    if (heightFt === "" || heightIn === "") return "Please enter your height (ft/in).";
    if (!activity) return "Please select your activity level.";
    if (!gender) return "Please select your metabolism profile.";
    return "";
  }

  function handleNext(e) {
    e.preventDefault();
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  }

  function handleBack(e) {
    e.preventDefault();
    setError("");
    setStep(1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError("");

    // 1) Sign up with Supabase (this will send confirmation email if enabled)
    const signUp = await signUpWithPassword({
      email: email.trim(),
      password,
      firstName: first.trim(),
      lastName: last.trim(),
    });

    if (!signUp.ok) {
      setError(
        /already/i.test(signUp.error)
          ? "This email already has an account. Please log in instead."
          : (signUp.error || "Could not create account.")
      );
      return;
    }

    // 🔍 If SupaBass did NOT give us a session, that usually means
    // email confirmation is required. Send them to the Check Email page.
    const hasSession = !!signUp.data?.session;
    if (!hasSession) {
      onNeedEmailConfirm(email.trim());
      return;
    }

    // 2) If we DO have a session, finish by creating the backend profile
    const weightKg = lbsToKg(weightLbs);
    const heightCm = ftInToCm(heightFt, heightIn);

    const api = await createUserProfile({
      firstName: first.trim(),
      lastName: last.trim(),
      gender,
      dobYear,
      dobMonth,
      dobDay,
      heightCm,
      weightKg,
      activity,
      goal: "maintain",
      dietaryFlags: ["none"],
      mealsPerDay: 3,
    });

    if (!api.ok) {
      setError(api.error || "Failed to create user profile.");
      return;
    }

    onCreated({ user: signUp.data?.user, profile: api.data?.user });
  }

  // 🧱 Normal 2-step form
  return (
    <main className={styles.screen}>
      <div className={styles.header}>
        <h1 className="h1">{step === 1 ? "Create Account" : "Your Details"}</h1>
        <p className="caption">
          {step === 1
            ? "Start with your account info."
            : "A few details to personalize your plan."}
        </p>
      </div>

      <form
        className={styles.form}
        onSubmit={step === 1 ? handleNext : handleSubmit}
      >
        {step === 1 && (
          <>
            <FormSection title="Name">
              <FieldRow cols={1}>
                <TextInput
                  id="first"
                  label="First name"
                  value={first}
                  onChange={setFirst}
                />
                <TextInput
                  id="last"
                  label="Last name"
                  value={last}
                  onChange={setLast}
                />
              </FieldRow>
            </FormSection>

            <FormSection title="Account Info">
              <FieldRow cols={1}>
                <TextInput
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                />
                <PasswordInput
                  id="password"
                  label="Password"
                  value={password}
                  onChange={setPassword}
                />
                <PasswordInput
                  id="confirm"
                  label="Confirm Password"
                  value={confirm}
                  onChange={setConfirm}
                />
              </FieldRow>
            </FormSection>

            {error && <p className={`caption ${styles.error}`}>{error}</p>}

            <div className={styles.actions}>
              <PrimaryButton type="submit" label="Continue" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <FormSection title="Date of Birth">
              <FieldRow cols={3}>
                <Select
                  id="dob-month"
                  label="Month"
                  value={dobMonth}
                  onChange={setDobMonth}
                  options={[{ value: "", label: "--" }, ...months]}
                />
                <Select
                  id="dob-day"
                  label="Day"
                  value={dobDay}
                  onChange={setDobDay}
                  options={[{ value: "", label: "--" }, ...days]}
                />
                <Select
                  id="dob-year"
                  label="Year"
                  value={dobYear}
                  onChange={setDobYear}
                  options={[{ value: "", label: "--" }, ...years]}
                />
              </FieldRow>
            </FormSection>

            <FormSection title="Personal Info">
              <FieldRow cols={2}>
                <TextInput
                  id="weight"
                  label="Weight (lbs)"
                  type="number"
                  inputMode="numeric"
                  value={weightLbs}
                  onChange={setWeightLbs}
                />
                <HeightInput
                  feet={heightFt}
                  inches={heightIn}
                  onChange={({ feet, inches }) => {
                    setHeightFt(feet);
                    setHeightIn(inches);
                  }}
                />
              </FieldRow>
            </FormSection>

            <FormSection title="Activity Level">
              <ActivityLevel value={activity} onChange={setActivity} />
            </FormSection>

            <FormSection title="Metabolism Profile">
              <FieldRow cols={1}>
                <Select
                  id="gender"
                  label="Used only to calculate your energy needs"
                  value={gender}
                  onChange={setGender}
                  options={genders}
                />
                <p className="caption" style={{ marginTop: 4 }}>
                  You can change this later in Profile.
                </p>
              </FieldRow>
            </FormSection>

            {error && <p className={`caption ${styles.error}`}>{error}</p>}

            <div className={styles.actionsTwo}>
              <button
                type="button"
                className={`${styles.secondaryButton} body-text`}
                onClick={handleBack}
              >
                Back
              </button>
              <PrimaryButton type="submit" label="Create Account" />
            </div>
          </>
        )}
      </form>
    </main>
  );
}

export default CreateAccount;