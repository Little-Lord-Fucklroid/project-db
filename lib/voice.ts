export async function preloadVoices() {
  await new Promise<void>((resolve) => {
    const voices = window.speechSynthesis.getVoices();

    if (voices.length) {
      resolve();
    } else {
      window.speechSynthesis.onvoiceschanged = () => resolve();
    }
  });
}

export async function speakText(text: string) {
  window.speechSynthesis.cancel();

  const speechText = text
    .replace(/\bMmmmm+\b/gi, "mmm...")
    .replace(/\bHmmmm+\b/gi, "hmm...");

  await preloadVoices();

  const utterance = new SpeechSynthesisUtterance(speechText);
  const voices = window.speechSynthesis.getVoices();

  const preferredVoice =
    voices.find(
      (v) =>
        v.name.toLowerCase().includes("aria") ||
        v.name.toLowerCase().includes("jenny") ||
        v.name.toLowerCase().includes("microsoft") ||
        v.name.toLowerCase().includes("female")
    ) || voices.find((v) => v.lang.includes("en"));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.rate = 0.9;
  utterance.pitch = 1.15;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}