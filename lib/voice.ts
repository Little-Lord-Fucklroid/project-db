let voicesLoaded = false;

function getVoices() {
  return window.speechSynthesis.getVoices();
}

export function preloadVoices() {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    const voices = getVoices();

    if (voices.length > 0) {
      voicesLoaded = true;
      resolve();
      return;
    }

    window.speechSynthesis.onvoiceschanged = () => {
      voicesLoaded = true;
      resolve();
    };

    setTimeout(() => {
      resolve();
    }, 1000);
  });
}

function pickBestVoice() {
  const voices = getVoices();

  const preferredVoiceNames = [
    "Samantha",
    "Karen",
    "Victoria",
    "Serena",
    "Ava",
    "Susan",
    "Google UK English Female",
    "Google US English",
    "Microsoft Jenny",
    "Microsoft Aria",
    "Microsoft Zira",
  ];

  for (const preferredName of preferredVoiceNames) {
    const match = voices.find((voice) =>
      voice.name
        .toLowerCase()
        .includes(preferredName.toLowerCase())
    );

    if (match) {
      return match;
    }
  }

  const englishFemaleLikeVoice = voices.find((voice) => {
    const name = voice.name.toLowerCase();

    return (
      voice.lang.toLowerCase().startsWith("en") &&
      !name.includes("male") &&
      !name.includes("david") &&
      !name.includes("mark") &&
      !name.includes("daniel")
    );
  });

  if (englishFemaleLikeVoice) {
    return englishFemaleLikeVoice;
  }

  const englishVoice = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith("en")
  );

  return englishVoice || voices[0];
}

export async function speakText(text: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (!text.trim()) {
    return;
  }

  await preloadVoices();

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickBestVoice();

  if (voice) {
    utterance.voice = voice;
  }

  utterance.rate = 0.9;
  utterance.pitch = 1.14;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}