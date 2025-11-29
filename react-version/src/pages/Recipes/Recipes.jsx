// src/pages/Recipes/Recipes.jsx
import { useState } from "react";
import { FiSearch } from "react-icons/fi";

import styles from "./Recipes.module.css";

import AppHeader from "@/components/AppHeader/AppHeader";
import MealTypeChip from "@/components/MealTypeChip/MealTypeChip";
import RecipeCard from "@/components/RecipeCard/RecipeCard";

// 🥣 Mock meal types with placeholder images
const MEAL_TYPES = [
  {
    id: "breakfast",
    label: "Breakfast",
    imageUrl:
      "https://media.istockphoto.com/id/534159727/photo/hearty-breakfast-sandwich-on-a-bagel.jpg?b=1&s=612x612&w=0&k=20&c=AMy3wlLyQoW2JYFVCkjOFalxJlnEOtmY6nbtGFJpcJk=",
  },
  {
    id: "lunch",
    label: "Lunch",
    imageUrl:
      "https://media.istockphoto.com/id/1400980767/photo/ham-sandwich-with-cheese-lettuce-and-tomato.jpg?b=1&s=612x612&w=0&k=20&c=UKgVkjyFqZJN7VWyA4yxZBIJ335KLo7wJo9bNV-bvGw=",
  },
  {
    id: "dinner",
    label: "Dinner",
    imageUrl:
      "https://images.pexels.com/photos/769969/pexels-photo-769969.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "snack",
    label: "Snack",
    imageUrl:
      "https://images.pexels.com/photos/1109197/pexels-photo-1109197.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

// 🍽 Mock recipes (you can swap later with real data)
const RECOMMENDED_RECIPES = [
  {
    id: "blueberry-pancakes",
    title: "Blueberry Pancakes",
    imageUrl:
      "https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=800",
    dietTag: "Vegan",
    timeMinutes: 15,
    rating: 4.9,
    isFavorite: true,
  },
  {
    id: "beyond-chili",
    title: "Beyond Chili",
    imageUrl:
      "https://media.istockphoto.com/id/1417561380/photo/bean-and-corn-soup-or-ragout-red-bean-stew-on-a-wooden-background-food-protein-vegan-dish.jpg?b=1&s=612x612&w=0&k=20&c=bTUCP9ZqZJ67fEx_DyJS44WO4Eozjn4R9g1wxWlNccY=",
    dietTag: "Gluten-free",
    timeMinutes: 30,
    rating: 4.8,
    isFavorite: false,
  },
];

const ALL_RECIPES = [
  {
    id: "raspberry-pops",
    title: "Raspberry Pops",
    imageUrl:
      "https://images.pexels.com/photos/8468311/pexels-photo-8468311.jpeg?_gl=1*l7dz2t*_ga*MTQzMjM1MDguMTc2MzIyNzE0Nw..*_ga_8JE65Q40S6*czE3NjMyMjcxNDYkbzEkZzEkdDE3NjMyMjczODIkajM1JGwwJGgw",
    dietTag: "Kosher",
    timeMinutes: 10,
    rating: 4.7,
  },
  {
    id: "mushroom-ravioli",
    title: "Mushroom Ravioli",
    imageUrl:
      "https://media.istockphoto.com/id/1007701826/photo/homemade-ravioli-in-garlic-mushrooms-sauce.jpg?b=1&s=612x612&w=0&k=20&c=lYMbBnYkHMae8Nk8E_1JMolOl5rUYV46177nBO5EHCY=",
    dietTag: "Vegetarian",
    timeMinutes: 25,
    rating: 4.9,
  },
  // add a few more mocks to fill the grid
  {
    id: "tofu-bowl",
    title: "Crispy Tofu Bowl",
    imageUrl:
      "https://media.istockphoto.com/id/1305943018/photo/stir-fried-marinated-tofu.jpg?b=1&s=612x612&w=0&k=20&c=7N_cfTHqNYhqHi3jfQnsretw2LAKBID9tvNxYX0c3i0=",
    dietTag: "Pescavegan",
    timeMinutes: 20,
    rating: 4.6,
  },
  {
    id: "lentil-soup",
    title: "Cozy Lentil Soup",
    imageUrl:
      "https://images.pexels.com/photos/4103375/pexels-photo-4103375.jpeg?auto=compress&cs=tinysrgb&w=800",
    dietTag: "Plant-based",
    timeMinutes: 35,
    rating: 4.8,
  },
];

function RecipesPage() {
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <main className={styles.screen}>
      <AppHeader title="Recipes" />

      <section className={styles.content}>
        {/* Search bar */}
        <div className={styles.searchWrapper}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search recipes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Meal type chips */}
        <div className={styles.mealTypesRow}>
          {MEAL_TYPES.map((type) => (
            <MealTypeChip
              key={type.id}
              label={type.label}
              imageUrl={type.imageUrl}
              isActive={selectedMealType === type.id}
              onClick={() =>
                setSelectedMealType((prev) =>
                  prev === type.id ? null : type.id
                )
              }
            />
          ))}
        </div>

        {/* Recommended section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className="h4">Recommended for you</h2>
            <button
              type="button"
              className={`${styles.sectionLink} caption`}
              onClick={() => {
                // 🧠 Future: navigate to full recommended list
              }}
            >
              View all
            </button>
          </div>

          <div className={styles.grid}>
            {RECOMMENDED_RECIPES.map((recipe) => (
              <RecipeCard key={recipe.id} {...recipe} />
            ))}
          </div>
        </section>

        {/* All recipes section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className="h4">All recipes</h2>
            <button
              type="button"
              className={`${styles.sectionLink} caption`}
              onClick={() => {
                // 🧠 Future: maybe navigate to an Explore page
              }}
            >
              View all
            </button>
          </div>

          <div className={styles.grid}>
            {ALL_RECIPES.map((recipe) => (
              <RecipeCard key={recipe.id} {...recipe} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default RecipesPage;
