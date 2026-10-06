// What the student typed follows them across the auth screens, in memory only (never the URL or storage).
let carriedEmail = "";

export function getCarriedEmail() {
  return carriedEmail;
}

export function setCarriedEmail(email: string) {
  carriedEmail = email;
}

// Create account's other fields, so Back from Enter code shows every field still filled in (07)
let carriedSignUp = { firstName: "", password: "" };

export function getCarriedSignUp() {
  return carriedSignUp;
}

export function setCarriedSignUp(fields: { firstName: string; password: string }) {
  carriedSignUp = fields;
}
