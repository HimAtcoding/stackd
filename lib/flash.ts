// A one-time message for the next screen, e.g. Home's "Password saved" toast after Enter code. In memory only.
let message: string | null = null;

export function setFlash(text: string) {
  message = text;
}

// Reading doesn't clear it, so it's safe in a state initializer that may run twice; clear it after it's shown
export function peekFlash() {
  return message;
}

export function clearFlash() {
  message = null;
}
