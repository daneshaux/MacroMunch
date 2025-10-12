namespace MacroMunch
{
    public static class MacroCalculator
    {
        public static (int Protein, int Carbs, int Fat) CalculateMacros(double weight, double height, double activityLevel)
        {
            // Placeholder logic
            int protein = (int)(0.8 * weight);
            int carbs = (int)(2.0 * weight);
            int fat = (int)(0.4 * weight);

            // Scale by activity level
            protein = (int)(protein * activityLevel);
            carbs = (int)(carbs * activityLevel);
            fat = (int)(fat * activityLevel);

            return (protein, carbs, fat);
        }
    }
}
