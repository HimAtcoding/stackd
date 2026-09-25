// The email field follows the student across the three auth screens, in memory only.
let carriedEmail = "";

export function getCarriedEmail() {
  return carriedEmail;
}

export function setCarriedEmail(email: string) {
  carriedEmail = email;
}
