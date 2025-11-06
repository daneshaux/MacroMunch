using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MacroMunch.Models;

namespace MacroMunch.Services
{
    public class ApiService
    {
        private readonly HttpClient _http;

        private const string BaseUrl = "https://macromunchservices.onrender.com";

        public ApiService(HttpClient httpClient)
        {
            _http = httpClient;
            _http.BaseAddress = new Uri(BaseUrl);
        }

        private void SetAuthHeader(string jwt)
        {
            _http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", jwt);
        }

        // ------------- USER -------------

        public async Task<CreateUserResponse?> CreateUserAsync(CreateUserRequest request, string jwt)
        {
            SetAuthHeader(jwt);

            var response = await _http.PostAsJsonAsync("/api/v1/users/", request);
            var json = await response.Content.ReadAsStringAsync();

            if (response.StatusCode == HttpStatusCode.Conflict)
            {
                // 409 = "user profile already exists"
                Console.WriteLine("CreateUser: profile already exists, skipping create.");
                return null; // treat as non-fatal
            }

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine("CreateUser error: " + json);
                return null;
            }

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<CreateUserResponse>(json, options);
        }

        public async Task<UserDto?> GetCurrentUserAsync(string jwt)
        {
            SetAuthHeader(jwt);

            var response = await _http.GetAsync("/api/v1/users/");
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                Console.WriteLine("GetCurrentUser error: " + error);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<UserDto>(json, options);
        }

        // ------------- MACROS -------------

        public async Task<CalculateMacrosResponse?> CalculateMacrosAsync(string jwt, string strategy = "custom")
        {
            SetAuthHeader(jwt);

            var url = $"/api/v1/meals/calculate?strategy={strategy}";
            var response = await _http.PostAsync(url, content: null);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                Console.WriteLine("CalculateMacros error: " + error);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<CalculateMacrosResponse>(json, options);
        }

        // ------------- USER GOAL UPDATE -------------

        public async Task<bool> UpdateUserGoalAsync(string jwt, string goal)
        {
            // Make sure Authorization header is set
            SetAuthHeader(jwt);

            // 1) Get the current user profile from the backend
            var user = await GetCurrentUserAsync(jwt);
            if (user == null)
            {
                Console.WriteLine("UpdateUserGoal: current user not found, cannot update goal.");
                return false;
            }

            // 2) Build a full CreateUserRequest using existing values + new goal
            var request = new CreateUserRequest
            {
                FirstName     = user.FirstName,
                LastName      = user.LastName,
                Sex           = user.Sex,
                Age           = user.Age,
                Height        = user.Height,        // already in cm from backend
                Weight        = user.Weight,        // already in kg from backend
                ActivityLevel = user.ActivityLevel, // e.g. "moderately_active"
                Goal          = goal,               // 🔥 <-- this is the ONLY thing we change
                DietaryFlags  = user.DietaryFlags ?? new List<string>(),
                MealsPerDay   = user.MealsPerDay
            };

            // 3) Send PUT /api/v1/users/ with the full payload
            var response = await _http.PutAsJsonAsync("/api/v1/users/", request);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                Console.WriteLine("UpdateUserGoal error: " + error);
                return false;
            }

            Console.WriteLine($"✅ UpdateUserGoal succeeded for goal='{goal}'");
            return true;
        }

        // ------------- MEAL PLAN -------------

        public async Task<MealPlanResponse?> GenerateMealPlanAsync(MealPlanRequest request, string jwt, string strategy = "basic")
        {
            SetAuthHeader(jwt);

            var url = $"/api/v1/meals/plan?strategy={strategy}";
            var response = await _http.PostAsJsonAsync(url, request);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                Console.WriteLine("GenerateMealPlan error: " + error);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<MealPlanResponse>(json, options);
        }

        // Optional: list available strategies
        public async Task<List<string>> GetMealStrategiesAsync(string jwt)
        {
            SetAuthHeader(jwt);

            var response = await _http.GetAsync("/api/v1/meals/strategies");
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                Console.WriteLine("GetMealStrategies error: " + error);
                return new List<string>();
            }

            var jsonDoc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            if (jsonDoc.RootElement.TryGetProperty("strategies", out var strategiesElem))
            {
                return strategiesElem.EnumerateArray().Select(s => s.GetString() ?? "").ToList();
            }

            return new List<string>();
        }
    }
}