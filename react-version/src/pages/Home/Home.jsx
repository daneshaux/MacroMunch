// src/pages/Home/Home.jsx
import { useOnboarding } from "@/context/OnboardingContext";
import HomeEmptyState from "@/pages/HomeEmptyState/HomeEmptyState";
import HomeMealPlan from "@/pages/HomeMealPlan/HomeMealPlan";

function Home({ firstName }) {
  const { state } = useOnboarding();

  if (state.planReady) {
    return <HomeMealPlan firstName={firstName} />;
  }

  return <HomeEmptyState firstName={firstName} />;
}

export default Home;
