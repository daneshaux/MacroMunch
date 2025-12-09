// src/pages/WelcomePage.jsx

import { useState } from "react";
import styles from "./WelcomePage.module.css";
import TextInput from "@/components/TextInput/TextInput";
import PasswordInput from "@/components/PasswordInput/PasswordInput";
import PrimaryButton from "@/components/PrimaryButton/PrimaryButton";
import SocialButton from "@/components/SocialButton/SocialButton";
import { FaGoogle, FaApple, FaFacebookF } from "react-icons/fa";
import googleLogo from "@/assets/google.svg";
import { checkEmailExists, loginWithPassword } from "@/lib/auth";


function WelcomePage({ onNewUser = () => {}, onLoggedIn = () => {} }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
  
    if (!email) {
      setError("Please enter your email.");
      return;
    }
  
    // STEP 1: user entered email
    if (!showPasswordStep) {
      const exists = await checkEmailExists(email);
      if (exists) {
        setShowPasswordStep(true); // show password field
        return;
      } else {
        // 🔹 NEW USER PATH
        onNewUser(email);
        return;
      }
    }
  
    // STEP 2: user is entering password
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    const result = await loginWithPassword({ email, password });
    if (result.ok) {
      // 🔹 EXISTING USER SUCCESS PATH
      onLoggedIn?.();
    } else {
      setError(result.error || "Login failed. Please try again.");
    }
  } 

  return (
    <main className={styles.screen}>
      <div className={styles.titleGroup}>
        {/* H1 */}
        <h1 className={`h1 ${styles.appName}`}>MacroMunch</h1>

        {/* Caption */}
        <p className={`caption ${styles.tagline}`}>
          Delicious macro-friendly meals, made for you.
        </p>
      </div>

      <section className={styles.authBlock}>
        {/* H3 */}
        <h2 className={`h3 ${styles.authTitle}`}>Log in or Sign Up</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <TextInput
            label="Email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(value) => {
              setEmail(value);
              setShowPasswordStep(false); // 🔁 go back to step 1 when email changes
              setPassword("");            // clear password
              setError("");               // clear error
            }}
          />

          {showPasswordStep && (
            <PasswordInput
              id="welcome-password"
              label="Password"
              value={password}
              onChange={setPassword}
            />
          )}

          <PrimaryButton
            type="submit"
            label={showPasswordStep ? "Log in" : "Continue with Email"}
          />

          {error && (
            <p className={`caption ${styles.errorText}`}>
              {error}
            </p>
          )}
        </form>

        <div className={styles.divider}>
          {/* body-text */}
          <span className={`body-text ${styles.dividerText}`}>or</span>
        </div>

        {/* H4 */}
        <p className={`h4 ${styles.continueWith}`}>Continue with</p>

        <div className={styles.socialRow}>
        <SocialButton
          icon={<img src={googleLogo} alt="Google logo" className="google-icon" />}
          label="Continue with Google"
          bgColor="#FFFFFF"
          borderColor="#4ADE80"
          onClick={() => alert("Google login")}
        />

          <SocialButton
            icon={<FaApple />}
            label="Continue with Apple"
            bgColor="#D9D9D9"
            iconColor="#1E303B"
            borderColor="#4ADE80"
            onClick={() => alert("Apple login")}
          />

          <SocialButton
            icon={<FaFacebookF />}
            label="Continue with Facebook"
            bgColor="#1877F2"
            iconColor="#FFFFFF"
            borderColor="#4ADE80"
            onClick={() => alert("Facebook login")}
          />
        </div>
      </section>
    </main>
  );
}


export default WelcomePage;