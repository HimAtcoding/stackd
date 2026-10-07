import { getSupabase } from "@/lib/supabase/client";

// A university and the official agreement link for one student's path, from the database (03 → Real accounts).

export type UniversityRecord = {
  id: string;
  slug: string;
  name: string;
  system: string | null;
  city: string | null;
  state: string | null;
};

export type AgreementLink = {
  url: string;
  academicYear: string;
};

function client() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase isn't configured");
  return supabase;
}

// Null when no university has this slug. Throws when it can't be loaded.
export async function getUniversityRecord(slug: string): Promise<UniversityRecord | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const { data, error } = await client()
    .from("institutions")
    .select("id, slug, name, system, city, state")
    .eq("slug", slug)
    .eq("institution_type", "university")
    .eq("is_demo", false)
    .maybeSingle();
  if (error) throw error;
  return data as UniversityRecord | null;
}

// The official agreement for home college → university → major, the latest academic year on record. Null when there isn't one.
export async function getAgreementLink(path: { collegeId: string; universityId: string; majorId: string }): Promise<AgreementLink | null> {
  const { data, error } = await client()
    .from("agreement_links")
    .select("source_url, academic_year")
    .eq("sending_institution_id", path.collegeId)
    .eq("receiving_institution_id", path.universityId)
    .eq("major_id", path.majorId)
    .eq("is_demo", false)
    .order("academic_year", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const row = data as { source_url: string; academic_year: string } | null;
  return row ? { url: row.source_url, academicYear: row.academic_year } : null;
}
