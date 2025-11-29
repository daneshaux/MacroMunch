// src/pages/CheckEmail/CheckEmail.jsx
import { useEffect } from "react";
import styles from "./CheckEmail.module.css";
import { FiMail } from "react-icons/fi";
import { supabase } from "@/lib/supabaseClient";

function CheckEmail({ email = "demo+1@macromunch.com", onContinue = () => {} }) {
  // 🔄 auto-detect confirmed session
  useEffect(() => {
    let isMounted = true;
    let intervalId;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      const hasSession = !!data?.session;
      if (hasSession) {
        if (intervalId) clearInterval(intervalId);
        onContinue(); // 🚀 go to Home / next step
      }
    }

    checkSession();                      // check once immediately
    intervalId = setInterval(checkSession, 3000); // then every 3s

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [onContinue]);

  return (
    <main className={styles.screen}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <div className={styles.iconCircle}>
            <FiMail className={styles.mailIcon} />
          </div>
        </div>

        <h1 className="h1">Check your email</h1>

        <p className={`caption ${styles.subtitle}`}>
          We’ve sent a confirmation link to{" "}
          <span className={styles.email}>{email}</span>. Tap the link to
          activate your account, then come back here. We’ll take you to your
          home screen automatically.
        </p>

        <p className={`caption ${styles.hint}`}>
          Didn’t get it? Check spam or promotions, or request a new link in a
          few minutes.
        </p>
      </div>
    </main>
  );
}

export default CheckEmail;