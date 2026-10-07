import { createClient } from "@supabase/supabase-js";
import { supabase as localSupabase } from "./mockSupabase.js";

// Set VITE_USE_LOCAL_STORAGE=true in .env to run entirely against
// localStorage (no Supabase project needed) for local testing.
const useLocal = import.meta.env.VITE_USE_LOCAL_STORAGE === "true";

// Replace these two strings with your actual Supabase credentials from:
// Supabase Dashboard -> Project Settings -> API
const supabaseUrl = "https://vmnxjhgojuabccuwljpk.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnhqaGdvanVhYmNjdXdsanBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNzc0NzksImV4cCI6MjEwMzc1MzQ3OX0.K8HR1BFkqAYJmSNTtv7l5vaA_vSh82trw4wqlBWRLuM";

export const supabase = useLocal
  ? localSupabase
  : createClient(supabaseUrl, supabaseAnonKey);
