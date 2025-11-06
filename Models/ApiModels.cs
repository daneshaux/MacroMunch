namespace MacroMunch.Models
{
    // ---------- USER PROFILE ----------

    public class CreateUserRequest
    {
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string Sex { get; set; } = "";  // "male" | "female"
        public int Age { get; set; }
        public double Height { get; set; }     // cm
        public double Weight { get; set; }     // kg
        public string ActivityLevel { get; set; } = "";  // "sedentary", "moderately_active", etc.
        public string Goal { get; set; } = "";           // "lose" | "maintain" | "gain"
        public List<string> DietaryFlags { get; set; } = new(); // "vegan", "keto", etc.
        public int MealsPerDay { get; set; }
    }

    public class UserDto
    {
        public string Id { get; set; } = "";
        public string SupabaseUserId { get; set; } = "";
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string Sex { get; set; } = "";
        public int Age { get; set; }
        public double Height { get; set; }
        public double Weight { get; set; }
        public string ActivityLevel { get; set; } = "";
        public string Goal { get; set; } = "";
        public List<string> DietaryFlags { get; set; } = new();
        public int MealsPerDay { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateUserResponse
    {
        public string Message { get; set; } = "";
        public UserDto User { get; set; } = new();
    }

    // ---------- CALCULATE MACROS ----------

    public class DailyMacrosDto
    {
        public int Calories { get; set; }
        public double Protein { get; set; }
        public double Carbs { get; set; }
        public double Fat { get; set; }
    }

    public class MealMacroDto
    {
        public int Meal_Number { get; set; }
        public int Calories { get; set; }
        public double Protein { get; set; }
        public double Carbs { get; set; }
        public double Fat { get; set; }
    }

    public class MacroMetadataDto
    {
        public string Strategy { get; set; } = "";
        public string Version { get; set; } = "";
        public string Timestamp { get; set; } = "";
        public double Bmr { get; set; }
        public double Tdee { get; set; }
        public double Activity_Multiplier { get; set; }
    }

    public class CalculateMacrosResponse
    {
        public DailyMacrosDto Daily_Macros { get; set; } = new();
        public List<MealMacroDto> Meal_Macros { get; set; } = new();
        public MacroMetadataDto Metadata { get; set; } = new();
    }

    // ---------- MEAL PLAN ----------

    public class IngredientDto
    {
        public string Ingredient_Id { get; set; } = "";
        public string Ingredient_Name { get; set; } = "";
        public string Category { get; set; } = "";
        public List<string> Diet_Tags { get; set; } = new();
        public double Grams { get; set; }
        public double Kcal { get; set; }
        public double Protein { get; set; }
        public double Carbs { get; set; }
        public double Fat { get; set; }
        public string? Notes { get; set; }
    }

    public class RecipeDto
    {
        public string Recipe_Id { get; set; } = "";
        public string Recipe_Name { get; set; } = "";
        public string Category { get; set; } = "";
        public List<string> Diet_Tags { get; set; } = new();
        public List<IngredientDto> Ingredients { get; set; } = new();
    }

    public class TargetMacrosDto
    {
        public int Meal_Number { get; set; }
        public int Calories { get; set; }
        public double Protein { get; set; }
        public double Carbs { get; set; }
        public double Fat { get; set; }
    }

    public class ActualMacrosDto
    {
        public int Calories { get; set; }
        public double Protein { get; set; }
        public double Carbs { get; set; }
        public double Fat { get; set; }
    }

    public class MealPlanItemDto
    {
        public int Meal_Number { get; set; }
        public string Meal_Id { get; set; } = "";
        public string Meal_Name { get; set; } = "";
        public List<RecipeDto> Recipes { get; set; } = new();
        public TargetMacrosDto Target_Macros { get; set; } = new();
        public ActualMacrosDto Actual_Macros { get; set; } = new();
    }

    public class MealPlanResponse
    {
        public List<MealPlanItemDto> Meal_Plans { get; set; } = new();
        public string Strategy { get; set; } = "";
    }

    public class MealPlanRequest
    {
        public List<MealMacroDto> Meal_Macros { get; set; } = new();
    }
}