# MacroMunch

MacroMunch is a personalized meal-planning PWA that helps people hit their macros with meals they actually enjoy.  
Built with **Blazor WebAssembly**, **.NET 8**, and **Firebase Realtime Database**.

---

## What it does (MVP)

- **Onboarding → Macros**  
  Users enter goals (maintain/lose/gain), dietary preferences, or manual macros.  
  Macros are stored under `manualMacros` in Firebase (no login in the MVP).

- **Dynamic Meal Plan Generator**  
  Generates a daily plan that:
  - avoids duplicate meals  
  - **always includes a snack**  
  - **scales ingredient quantities** inside each recipe (macro-dynamic meals) to fit the user’s targets

- **Recipe Library**  
  Browse, filter by tags/attributes, and swap into the plan.

- **Data**  
  Recipes are stored in Firebase with detailed macros, ingredients, and instructions.

---

## Architecture (high-level)

- **Blazor WebAssembly (PWA)**: UI & client logic
- **Firebase Realtime Database**: persistent data layer (macros, recipes, generated plans)
- **Interop**: minimal JS interop for Firebase SDK calls

**Key pages/components**
- `Pages/Home.razor` – displays the meal plan (acts as “home screen”)  
- `Pages/MealPlan.razor` – meal plan UI (generated or loaded)  
- `Pages/Recipes.razor` – recipe grid/list & details  
- `Shared` – common components (cards, buttons, layout)  
- `wwwroot/firebase-config.json` – Firebase client config (see _Environment Setup_)

> The app expects a UID for loading macros/meal plans in some flows, but for the MVP we use **manualMacros** without auth.

---

## Prerequisites

- **.NET 8 SDK**  
- **Node.js** (optional; only if you want tooling like Tailwind or building assets separately)
- **Firebase project** (Realtime Database enabled)

---

## Getting Started

1) **Clone & run**
```bash
git clone https://github.com/daneshaux/MacroMunch.git
cd MacroMunch
dotnet restore
dotnet watch run

pp will serve at http://localhost:5000
 (or the port shown in the console).

```
2) Create Firebase project

- Go to Firebase Console → Add project

- Enable Realtime Database (Start in test mode for local dev, or set rules below)

3) Add client config
Create wwwroot/firebase-config.json:
```
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_PROJECT.firebaseapp.com",
  "databaseURL": "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  "projectId": "YOUR_PROJECT",
  "storageBucket": "YOUR_PROJECT.appspot.com",
  "messagingSenderId": "YOUR_SENDER_ID",
  "appId": "YOUR_APP_ID"
}
```
4) Seed data (optional)
- Add a few recipes under /recipes/{recipeId} with fields like:
```
{
  "title": "Honey Garlic Salmon Bowl",
  "tags": ["pescatarian","30-min"],
  "baseMacrosPerServing": { "cal": 520, "p": 35, "c": 60, "f": 18 },
  "ingredients": [
    { "name": "salmon", "unit": "g", "amount": 120, "macros": {"p": 25, "c": 0, "f": 8} },
    { "name": "jasmine rice", "unit": "g", "amount": 140, "macros": {"p": 3, "c": 40, "f": 1} }
  ],
  "instructions": ["Season salmon...", "Cook rice...", "Assemble bowl..."]
}
```
## Environment & Configuration
- Firebase rules (dev-friendly)
  Use stricter rules for production. For local prototyping:
```
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
- Recommended (more cautious)
If you want to allow reads but restrict writes while collaborating:
```
{
  "rules": {
    ".read": true,
    ".write": false
  }
}
```
## Project Structure (simplified)
```
MacroMunch/
├─ Pages/
│  ├─ Home.razor              # Home screen (displays today's plan)
│  ├─ MealPlan.razor          # Generator + plan UI
│  ├─ Recipes.razor           # Recipe library grid/list
│  └─ Onboarding.razor        # Input goals/preferences/manual macros
├─ Services/
│  ├─ FirebaseInterop.cs      # Thin wrapper for Firebase calls
│  └─ MealPlanGenerator.cs    # Core generation & scaling logic
├─ Models/
│  ├─ Macros.cs               # Targets, per-meal splits
│  ├─ Recipe.cs               # Recipe + macro model
│  └─ MealPlan.cs             # Generated plan model
├─ wwwroot/
│  ├─ firebase-config.json    # Your Firebase client creds
│  └─ manifest.webmanifest    # PWA manifest
└─ Program.cs
```
## Business Logic Notes (for collaborators)
MealPlanGenerator goals
- Avoid duplicate meals in a single plan/day
- Always include one snack
- Scale ingredient amounts inside each recipe (e.g., increase rice from 100g to 140g)
rather than duplicating servings
- Respect dietary tags/preferences (e.g., pescatarian)

Data Access
- Macros: users/{userId}/manualMacros (MVP can use a fixed or mock userId)
- Recipes: /recipes/{recipeId}
- Plans: mealPlans/{userId}/{date}

## Running & Building
Dev
```
dotnet watch run
```
Production build
```
dotnet publish -c Release
```
Outputs to bin/Release/net8.0/publish/wwwroot for static hosting (e.g., Firebase Hosting, GitHub Pages with some tweaks, or any static host that supports client-side routing).

## Testing (coming soon)
- Unit tests for MealPlanGenerator (target matching, scaling, snack guarantee)
- Snapshot tests for recipe scaling edge cases (very high protein targets, etc.)

## Contributing
- Branch off main using:
feature/<short-name> or fix/<short-name>
- Commit messages:
feat: add meal scaling by macro gap
fix: prevent duplicate lunch
docs: expand README with Firebase setup

Open a Pull Request when ready. If the change affects generation logic, include a short test plan in the PR description.

Access levels
- Primary collaborator (dev): Admin (can manage settings, branches, CI, etc.)
- Others: Write or Read as needed

## License
MIT © 2025 MacroMunch
