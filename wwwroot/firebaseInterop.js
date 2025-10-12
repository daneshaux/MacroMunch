// Initialize Firebase app only if it’s not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp({
        apiKey: "AIzaSyBAfdoHeJG-M3l8DVqwtIBa0yuCVf7K9aE",
        authDomain: "macromunch-96428.firebaseapp.com",
        projectId: "macromunch-96428",
        storageBucket: "macromunch-96428.appspot.com",
        messagingSenderId: "812531150005",
        appId: "1:812531150005:web:0273cac75bbbef971fe2fc",
        measurementId: "G-NW1CMXF8KK",
        databaseURL: "https://macromunch-96428-default-rtdb.firebaseio.com"
    });
}

// Save user info (first name, last name, birthday, weight, height, email, password)
window.firebaseInterop = {
    saveUserEmail: function(userId, email) {
        const dbRef = firebase.database().ref("users/" + userId);
        dbRef.set({
            email: email
        });
    },

      // Sign up a user with email & password
    createUserWithEmail: async function(email, password) {
        try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        return userCredential.user.uid; // Return UID to Blazor
        } catch (error) {
        console.error("Error creating user:", error.message);
        throw error;
        }
    },

    // Log in a user with email & password
    signInUserWithEmail: async function(email, password) {
        try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        return userCredential.user.uid; // Return UID to Blazor
        } catch (error) {
        console.error("Error signing in:", error.message);
        throw error;
        }
    },

    // Save user info (first name, last name, birthday, weight, height, email, password)
    saveUserInfo: function (userId, firstName, lastName, birthday, weight, height, email, password) {
        const dbRef = firebase.database().ref("users/" + userId + "/info");
        dbRef.set({
            firstName: firstName,
            lastName: lastName,
            birthday: birthday,
            weight: weight,
            height: height,
            email: email,
            password: password // ⚠️ In production, never store plain text passwords!
        });
    },

    // Save user goal (weight loss, weight gain, maintenance)
    saveUserGoal: function(userId, goal) {
        const dbRef = firebase.database().ref("users/" + userId + "/goal");
        dbRef.set(goal);
    },

    // Save Manual Macros
    saveManualMacros: function(userId, macros) {
        const dbRef = firebase.database().ref("users/" + userId + "/manualMacros");
        dbRef.set({
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat
        });
    },

    // Save Dietary Preferences
    saveDietaryPreferences: function (userId, dietaryPreferences) {
        const dbRef = firebase.database().ref("users/" + userId + "/dietaryPreferences");
        dbRef.set(dietaryPreferences);
    },

    // Save selected allergies
    saveAllergies: function(userId, allergies) {
        const dbRef = firebase.database().ref("users/" + userId + "/allergies");
        dbRef.set(allergies);
    },

    // Save selected eating styles
    saveEatingStyles: function(userId, eatingStyles) {
        const dbRef = firebase.database().ref("users/" + userId + "/eatingStyles");
        dbRef.set(eatingStyles);
    },

    // Save spice level
    saveSpiceLevel: function(userId, spiceLevel) {
        const dbRef = firebase.database().ref("users/" + userId + "/spiceLevel");
        dbRef.set(spiceLevel);
    },

    // Save flavor profiles
    saveFlavorProfiles: function(userId, flavors) {
        const dbRef = firebase.database().ref("users/" + userId + "/flavorProfiles");
        dbRef.set(flavors);
    },

    // Get user macros
    getUserMacros: function(userId) {
        const dbRef = firebase.database().ref("users/" + userId + "/macros");
        return dbRef.once("value").then(snapshot => {
            const data = snapshot.val();
            console.log("Fetched macros for userId: ", userId, data); // ✅ Add this
            return JSON.stringify(data || {});
        });
    },    
    
    // Save meal plan
    saveMealPlan(userId, mealPlan) {
        firebase.database().ref(`users/${userId}/mealPlan`).set(mealPlan);
    },

    // Get meal plan
    getMealPlan: function(userId) {
        const dbRef = firebase.database().ref("users/" + userId + "/mealPlan");
        return dbRef.once("value").then(snapshot => {
            const data = snapshot.val();
            console.log("Fetched meal plan: ", data);
            return JSON.stringify(data || []);
        });
    }
};

// Function to get avatar URL from local storage
window.mm = window.mm || {};
window.mm.getAvatar = () => localStorage.getItem("userAvatarUrl");


