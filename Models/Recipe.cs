namespace MacroMunch.Models
{
    public class Recipe
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public string ImageUrl { get; set; } = "";
        public string Category { get; set; } = "";              // Breakfast|Lunch|Dinner|Snack
        public List<string> DietaryTags { get; set; } = new();  // Vegan, Gluten-free, etc.
        public double Rating { get; set; } = 0;                  // 0..5
        public int PrepTime { get; set; } = 0;                   // minutes
        public bool IsFavorite { get; set; } = false;
    }
}