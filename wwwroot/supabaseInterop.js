window.supabaseInterop = (function () {
    const supabaseUrl = "https://hxlyuppwittleizespio.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4bHl1cHB3aXR0bGVpemVzcGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODE2NjYsImV4cCI6MjA3NzA1NzY2Nn0.wkQCZMtxivsWJtsfpFkHKm0vBmxYFZfXzA-fjDBvJX4";
  
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  
    return {
      async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
  
        if (error) {
          console.error("Supabase signUp error:", error);
          throw new Error(error.message);
        }
  
        // for now we don't rely on session here
        return true;
      },
  
      async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
  
        if (error) {
          console.error("Supabase signIn error:", error);
          throw new Error(error.message);
        }
  
        // return the JWT access token
        return data.session?.access_token || null;
      },
  
      async getAccessToken() {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Supabase getSession error:", error);
          return null;
        }
        return data.session?.access_token || null;
      },
  
      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Supabase signOut error:", error);
          throw new Error(error.message);
        }
      }
    };
  })();   