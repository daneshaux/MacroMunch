using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.JSInterop;

namespace MacroMunch.Services // 👈 Add this!
{
    public class MealPlanGenerator
    {
        private readonly IJSRuntime _js;

        public MealPlanGenerator(IJSRuntime js)
        {
            _js = js;
        }

        public async Task GenerateAndSaveMealPlan(string userId)
        {
            var macrosJson = await _js.InvokeAsync<string>("firebaseInterop.getUserMacros", userId);
            Console.WriteLine("Fetched Macros JSON: " + macrosJson); // ✅ Log it!

            if (string.IsNullOrWhiteSpace(macrosJson))
            {
                Console.WriteLine("No macros found for user.");
                return;
            }

            var macros = JsonSerializer.Deserialize<UserMacros>(macrosJson);
            if (macros == null)
            {
                Console.WriteLine("Failed to parse macros JSON.");
                return;
            }

            Console.WriteLine($"Macros parsed: Protein={macros.Protein}, Carbs={macros.Carbs}, Fat={macros.Fat}");

            // 3️⃣ Generate meal plan
            var mealPlan = new List<Meal>
            {
                new Meal { Name = "Protein Oat Bowl", Protein = 30, Carbs = 45, Fat = 10, Calories = 400, ImageUrl = "images/recipes/oat-bowl.png", Type = "Breakfast" },
                new Meal { Name = "Chicken Salad", Protein = 35, Carbs = 40, Fat = 15, Calories = 500, ImageUrl = "images/recipes/chicken-salad.png", Type = "Lunch" },
                new Meal { Name = "Salmon & Veggies", Protein = 40, Carbs = 35, Fat = 20, Calories = 550, ImageUrl = "images/recipes/salmon-veggies.png", Type = "Dinner" }
            };

            // 4️⃣ Save meal plan
            await _js.InvokeVoidAsync("firebaseInterop.saveMealPlan", userId, mealPlan);
            Console.WriteLine("Meal plan saved to Firebase!");
        }
    }

    // Helper classes for deserialization
    public class UserMacros
    {
        public double Protein { get; set; }
        public double Carbs { get; set; }
        public double Fat { get; set; }
    }

    public class Meal
    {
        public string Name { get; set; } = "";
        public string Type { get; set; } = "";
        public double Protein { get; set; }
        public double Carbs { get; set; }
        public double Fat { get; set; }
        public double Calories { get; set; }
        public string ImageUrl { get; set; } = "";
    }
}