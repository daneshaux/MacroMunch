// src/App.jsx
import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./index.css";

import WelcomePage from "@/pages/WelcomePage/WelcomePage";
import CreateAccount from "@/pages/CreateAccount/CreateAccount";
import Home from "@/pages/Home/Home";
import Recipes from "@/pages/Recipes/Recipes";
import Profile from "@/pages/Profile/Profile";
import EditMealsPage from "@/pages/EditMeals/EditMeals";
import BottomNav from "@/components/BottomNav/BottomNav";
import CheckEmail from "@/pages/CheckEmail/CheckEmail";
import { supabase } from "@/lib/supabaseClient";
import EditActivityPage from "@/pages/EditActivity/EditActivity";
import EditGoalPage from "@/pages/EditGoal/EditGoal";
import EditWeightPage from "@/pages/EditWeight/EditWeight";
import EditHeightPage from "@/pages/EditHeight/EditHeight";
import EditAgePage from "@/pages/EditAge/EditAge";
import EditPreferencesPage from "@/pages/EditPreferences/EditPreferences";

// 🆕 Onboarding context + screen
import { OnboardingProvider } from "@/context/OnboardingContext";
import OnboardingGoal from "@/pages/OnboardingGoal/OnboardingGoal";
import OnboardingPlanBuild from "@/pages/OnboardingPlanBuild/OnboardingPlanBuild";
import OnboardingManualMacros from "@/pages/OnboardingManualMacros/OnboardingManualMacros";
import OnboardingPreferences from "@/pages/OnboardingPreferences/OnboardingPreferences";
import OnboardingAllergies from "@/pages/OnboardingAllergies/OnboardingAllergies";
import OnboardingEatingStyles from "@/pages/OnboardingEatingStyles/OnboardingEatingStyles";
import OnboardingSpiceLevel from "@/pages/OnboardingSpiceLevel/OnboardingSpiceLevel";
import OnboardingFlavorProfiles from "@/pages/OnboardingFlavorProfiles/OnboardingFlavorProfiles";
import OnboardingLoading from "@/pages/OnboardingLoading/OnboardingLoading";
import Recipe from "./pages/Recipe/Recipe";

const DEV_BYPASS_AUTH = false;

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(DEV_BYPASS_AUTH);

  const [pendingEmail, setPendingEmail] = useState("");
  const [userFirstName, setUserFirstName] = useState("");

  // ✅ When Create Account finishes successfully
  function handleProfileCreated(data) {
    const guess =
      data?.profile?.firstname ||
      data?.profile?.firstName ||
      data?.user?.user_metadata?.firstName ||
      "";

    setUserFirstName(guess || "");
    navigate("/home", { replace: true });
  }

  // 🔐 Supabase auth listener
  useEffect(() => {
    if (DEV_BYPASS_AUTH) {
      // Skip Supabase auth entirely in dev bypass mode
      return;
    }

    let isMounted = true;

    // initial session check
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data?.session ?? null);
      setAuthReady(true);
    });

    // listen for sign-in / sign-out
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!isMounted) return;

      if (event === "SIGNED_IN") {
        setSession(sess);
        navigate("/home", { replace: true });
      }

      if (event === "SIGNED_OUT") {
        setSession(null);
        setUserFirstName("");
        navigate("/welcome", { replace: true });
      }
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  // Show bottom nav only on main app tabs
  const showBottomNav = ["/home", "/profile", "/recipes"].includes(
    location.pathname
  );

  const activeTab = location.pathname.startsWith("/profile")
    ? "profile"
    : location.pathname.startsWith("/recipes")
    ? "recipes"
    : "home";

  if (!authReady) {
    // simple splash while we check Supabase (or bypass in dev)
    return <div className="app-shell" />;
  }

  return (
    <OnboardingProvider>
      <div className="app-shell">
        <Routes>
          {/* Root: decide where to send them based on auth */}
          <Route
            path="/"
            element={
              DEV_BYPASS_AUTH
                ? <Navigate to="/home" replace />
                : session
                  ? <Navigate to="/home" replace />
                  : <Navigate to="/welcome" replace />
            }
          />

          {/* Welcome / login */}
          <Route
            path="/welcome"
            element={
              <WelcomePage
                onNewUser={(email) => {
                  setPendingEmail(email);
                  navigate("/create-account");
                }}
                onLoggedIn={() => {
                  navigate("/home");
                }}
              />
            }
          />

          {/* Create account onboarding */}
          <Route
            path="/create-account"
            element={
              <CreateAccount
                initialEmail={pendingEmail}
                session={session}
                onCreated={handleProfileCreated}
                // If Supabase needs email confirmation, go to Check Email page
                onNeedEmailConfirm={(email) => {
                  setPendingEmail(email);
                  navigate("/check-email");
                }}
              />
            }
          />

          {/* Check email screen */}
          <Route
            path="/check-email"
            element={
              <CheckEmail
                email={pendingEmail}
                onContinue={() => navigate("/home", { replace: true })}
              />
            }
          />

          {/* Home empty state */}
          <Route
            path="/home"
            element={<Home firstName={userFirstName || "there"} />}
          />

          {/* 🆕 Onboarding: Goal (Step 1) */}
          <Route path="/onboarding/goal" element={<OnboardingGoal />} />
          <Route
            path="/onboarding/plan-build"
            element={<OnboardingPlanBuild />}
          />
          <Route
            path="/onboarding/manual-macros"
            element={<OnboardingManualMacros />}
          />
          <Route
            path="/onboarding/diet"
            element={<OnboardingPreferences />}
          />
          <Route
            path="/onboarding/allergies"
            element={<OnboardingAllergies />}
          />
          <Route
            path="/onboarding/styles"
            element={<OnboardingEatingStyles />}
          />
          <Route
            path="/onboarding/spice"
            element={<OnboardingSpiceLevel />}
          />
          <Route
            path="/onboarding/flavors"
            element={<OnboardingFlavorProfiles />}
          />
          <Route
            path="/onboarding/loading"
            element={<OnboardingLoading />}
          />
          {/* <Route path="/onboarding/manual-macros" element={<ManualMacros />} /> */}

          {/* Recipes page */}
          <Route path="/recipes" element={<Recipes />} />

           {/* Recipe page */}
          <Route path="/recipe" element={<Recipe />} />

          {/* Profile page */}
          <Route path="/profile" element={<Profile />} />

          {/* Edit meals per day screen */}
          <Route path="/meals" element={<EditMealsPage />} />

          {/* Edit activity level screen */}
          <Route path="/activity" element={<EditActivityPage />} />

          {/* Edit goal screen */}
          <Route path="/goal" element={<EditGoalPage />} />

          {/* Edit weight screen */}
          <Route path="/weight" element={<EditWeightPage />} />

          {/* Edit height screen */}
          <Route path="/height" element={<EditHeightPage />} />

          {/* Edit age screen */}
          <Route path="/age" element={<EditAgePage />} />

          {/* Edit dietary preferences screen */}
          <Route path="/preferences" element={<EditPreferencesPage />} />

          {/* Catch-all: send to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {showBottomNav && (
          <BottomNav
            active={activeTab}
            onChange={(tab) => {
              if (tab === "home") navigate("/home");
              if (tab === "profile") navigate("/profile");
              if (tab === "recipes") navigate("/recipes");
            }}
          />
        )}
      </div>
    </OnboardingProvider>
  );
}

export default App;
