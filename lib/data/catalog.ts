import { getSupabase } from "@/lib/supabase/client";

// Schools and majors from the database (phase 3's import). Read with the anon key; row-level security lets anyone read.
// Demo rows are left out: these lists only ever show real records.

export type InstitutionType = "community_college" | "university";

export type Institution = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  system: string | null;
};

export type Major = {
  id: string;
  institutionId: string;
  name: string;
  degreeType: string | null;
};

function client() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase isn't configured");
  return supabase;
}

// Every college or university, sorted by name. Throws when the list can't be loaded.
export async function getInstitutions(type: InstitutionType): Promise<Institution[]> {
  const { data, error } = await client()
    .from("institutions")
    .select("id, slug, name, city, system")
    .eq("institution_type", type)
    .eq("is_demo", false)
    .order("name");
  if (error) throw error;
  return data as Institution[];
}

// The majors on record for these schools, sorted by name
export async function getMajors(institutionIds: string[]): Promise<Major[]> {
  if (!institutionIds.length) return [];
  const { data, error } = await client()
    .from("majors")
    .select("id, institution_id, name, degree_type")
    .in("institution_id", institutionIds)
    .eq("is_demo", false)
    .order("name");
  if (error) throw error;
  return (data as { id: string; institution_id: string; name: string; degree_type: string | null }[]).map((m) => ({
    id: m.id,
    institutionId: m.institution_id,
    name: m.name,
    degreeType: m.degree_type,
  }));
}
