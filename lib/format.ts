// Turns codes stored in the database into the words the screens show.

// institutions.system → the school's kind ("Public university"). Null when the code isn't one we know.
export function institutionKind(system: string | null): string | null {
  switch (system?.toUpperCase()) {
    case "UC":
    case "CSU":
      return "Public university";
    case "CCC":
      return "Community college";
    case "PRIVATE":
      return "Private university";
    default:
      return null;
  }
}

// majors.degree_type → "B.S.", "B.A.". Anything that isn't a plain run of capitals is shown as stored.
export function degreeLabel(degreeType: string | null): string | null {
  const code = degreeType?.trim();
  if (!code) return null;
  return /^[A-Z]{2,4}$/.test(code) ? `${code.split("").join(".")}.` : code;
}

// "Computer Science B.S."
export function majorWithDegree(name: string, degreeType: string | null): string {
  const degree = degreeLabel(degreeType);
  return degree ? `${name} ${degree}` : name;
}
