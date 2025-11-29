// super tiny fake "API" so you can test flows now

export async function checkEmailExists(email) {
    await wait(400); // simulate network
    // Treat these as existing accounts; everything else is "new user"
    const existing = ["demo@macromunch.app", "neesh@test.com"];
    return existing.includes(email.trim().toLowerCase());
  }
  
  export async function loginWithPassword({ email, password }) {
    await wait(400); // simulate network
    if (password === "password123") {
      return { ok: true };
    }
    return { ok: false, error: "Incorrect password" };
  }
  
  function wait(ms) {
    return new Promise(res => setTimeout(res, ms));
  }  