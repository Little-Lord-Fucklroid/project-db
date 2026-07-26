let currentSpeechRunId = 0;
let currentAudio: HTMLAudioElement | null = null;

// ─── Helper: get selected voice from localStorage ──────────────────────
function getSelectedVoice(): string {
  if (typeof window === "undefined") return "en-US-AvaNeural";
  return localStorage.getItem("vibe-voice") || "en-US-AvaNeural";
}

export function preloadVoices() {
  return Promise.resolve();
}

function cleanTextForSpeech(text: string) {
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/_/g, "")
    .replace(/`/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/\b[uU]+m{2,}\b/g, "um")
    .replace(/\b[mM]{2,}\b/g, "hmm")
    .replace(/\b[hH]+m{2,}\b/g, "hmm")
    .replace(/\b[aA]+h{2,}\b/g, "ah")
    .replace(/\b[oO]+h{2,}\b/g, "oh")
    .replace(/\b[uU]+h{2,}\b/g, "uh")
    .replace(/\b[aA]+w{2,}\b/g, "aw")
    .replace(/\b[aA]+w+h+\b/g, "aw")
    .replace(/\b[hH]e[hH]e+\b/g, "hee heeee")
    .replace(/\b[hH]aha+\b/g, "ha ha")
    .replace(/\b[lL]ol\b/g, "haha")
    .replace(/\b[oO]{2,}kay\b/g, "okay")
    .replace(/\b[yY]+e+s+\b/g, "yes")
    .replace(/\b[nN]+o+\b/g, "no")
    .replace(/\b[sS]+o+\b/g, "so")
    .replace(/—/g, ", ")
    .replace(/–/g, ", ")
    .replace(/…/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}

function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  if (typeof window !== "undefined") {
    window.speechSynthesis.cancel();
  }
}

async function playAvaNeuralVoice(text: string, runId: number, retryCount = 0) {
  const maxRetries = 2;
  const delay = 1000 * Math.pow(2, retryCount);

  try {
    const voice = getSelectedVoice(); // <-- get the selected voice
console.log("🔊 Frontend selected voice:", voice);
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice, // <-- send the voice to the API
      }),
    });

    if (!response.ok) {
      throw new Error("TTS API failed.");
    }

    if (runId !== currentSpeechRunId) return;

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    try {
      await new Promise<void>((resolve, reject) => {
        if (runId !== currentSpeechRunId) {
          resolve();
          return;
        }

        const audio = new Audio(audioUrl);
        currentAudio = audio;

        audio.onended = () => resolve();
        audio.onerror = () => reject();

        audio.play().catch(reject);
      });
    } finally {
      URL.revokeObjectURL(audioUrl);
    }
  } catch (error) {
    if (retryCount < maxRetries) {
      console.warn(`TTS attempt ${retryCount + 1} failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return playAvaNeuralVoice(text, runId, retryCount + 1);
    }
    console.warn("All TTS retries exhausted.");
    throw error;
  }
}

function getBrowserFallbackVoice() {
  const voices = window.speechSynthesis.getVoices();

  const preferredNames = [
    "Samantha",
    "Karen",
    "Victoria",
    "Google UK English Female",
    "Google US English",
    "Microsoft Jenny",
    "Microsoft Aria",
    "Microsoft Zira",
  ];

  for (const preferredName of preferredNames) {
    const match = voices.find((voice) =>
      voice.name.toLowerCase().includes(preferredName.toLowerCase())
    );

    if (match) {
      return match;
    }
  }

  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) || null
  );
}

async function playBrowserFallback(text: string, runId: number) {
  if (runId !== currentSpeechRunId) {
    return;
  }

  await new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getBrowserFallbackVoice();

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = "en-US";
    }

    utterance.rate = 0.9;
    utterance.pitch = 1.02;
    utterance.volume = 1;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

export async function speakText(text: string) {
  if (typeof window === "undefined") {
    return;
  }

  const cleanedText = cleanTextForSpeech(text);

  if (!cleanedText) {
    return;
  }

  currentSpeechRunId++;

  const runId = currentSpeechRunId;

  stopCurrentAudio();

  try {
    await playAvaNeuralVoice(cleanedText, runId);
  } catch (error) {
    console.warn("TTS failed. Using browser fallback.", error);

    if (runId === currentSpeechRunId) {
      await playBrowserFallback(cleanedText, runId);
    }
  }
}

export async function prewarmTts() {
  try {
    await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: ".",
        prewarm: true,
      }),
    });
  } catch {
    // ignore
  }
}