type Message = {
  role: "user" | "ai";
  text: string;
};
const CHAT_STORAGE_KEY = "vibe-messages";
const INCOGNITO_PIN_KEY = "vibe-incognito-pin";

export function loadSavedMessages(): Message[] {
  try {
    const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);

    if (!savedMessages) {
      return [];
    }

    return JSON.parse(savedMessages);
  } catch {
    return [];
  }
}

export function saveMessages(messages: Message[]) {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
}

export function getIncognitoPin() {
  return localStorage.getItem(INCOGNITO_PIN_KEY);
}

export function saveIncognitoPin(pin: string) {
  localStorage.setItem(INCOGNITO_PIN_KEY, pin);
}

export function isValidPin(pin: string) {
  return /^\d{4}$/.test(pin);
}