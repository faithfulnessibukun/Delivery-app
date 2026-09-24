import { createClient } from "@supabase/supabase-js";

// Replace these two strings with your actual Supabase credentials from:
// Supabase Dashboard -> Project Settings -> API
const supabaseUrl = "https://vmnxjhgojuabccuwljpk.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnhqaGdvanVhYmNjdXdsanBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNzc0NzksImV4cCI6MjEwMzc1MzQ3OX0.K8HR1BFkqAYJmSNTtv7l5vaA_vSh82trw4wqlBWRLuM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);