namespace MacroMunch.Models;

public class Meal
{
    public string Name { get; set; } = "";
    public string ImageUrl { get; set; } = "";
    public int Calories { get; set; }
    public int Protein { get; set; }
    public int Carbs { get; set; }
    public int Fat { get; set; }

    public Meal(string name, string imageUrl, int calories, int protein, int carbs, int fat)
    {
        Name = name;
        ImageUrl = imageUrl;
        Calories = calories;
        Protein = protein;
        Carbs = carbs;
        Fat = fat;
    }
}