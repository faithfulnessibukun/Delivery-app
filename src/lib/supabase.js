// Local-storage-backed mock of the Supabase client — lets the app run
// fully client-side (no live backend) for demo/testing purposes.
// Same named export `supabase` as the real client, so nothing else in
// the app needs to change.
import { supabase } from "./mockSupabase";
import { seedDemoData } from "./seedDemoData";

seedDemoData();

export { supabase };
