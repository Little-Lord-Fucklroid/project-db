let voicesReadyPromise: Promise<void> | null = null;
let currentSpeechRunId = 0;

function getVoices() {
  if (typeof window === "undefined") {
    return [];
  }

  return window.speechSynthesis.getVoices();
}

export function preloadVoices() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (voicesReadyPromise) {
    return voicesReadyPromise;
  }

  voicesReadyPromise = new Promise<void>((resolve) => {
    const existingVoices = getVoices();

    if (existingVoices.length > 0) {
      resolve();
      return;
    }

    const timeout = window.setTimeout(() => {
      resolve();
    }, 1200);

    window.speechSynthesis.onvoiceschanged = () => {
      window.clearTimeout(timeout);
      resolve();
    };
  });

  return voicesReadyPromise;
}

function cleanTextForSpeech(text: string) {
  return text
    // remove markdown
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/_/g, "")
    .replace(/`/g, "")
    .replace(/#{1,6}\s/g, "")

    // make filler sounds pronounce naturally
    .replace(/\b[uU]+m{2,}\b/g, "um")
    .replace(/\b[hH]+m{2,}\b/g, "hmm")
    .replace(/\b[mM]{2,}\b/g, "hmm")
    .replace(/\b[aA]+h{2,}\b/g, "ah")
    .replace(/\b[oO]+h{2,}\b/g, "oh")
    .replace(/\b[uU]+h{2,}\b/g, "uh")

    // laughter / soft emotional sounds
    .replace(/\b[hH]e[hH]e\b/g, "heh heh")
    .replace(/\b[hH]e[hH]e[hH]e+\b/g, "heh heh")
    .replace(/\b[hH]aha+\b/g, "ha ha")
    .replace(/\b[lL]ol\b/g, "laughing")

    // fixes "aww" being spoken as letters
    .replace(/\b[aA]+w{2,}\b/g, "aw")
    .replace(/\b[aA]+w+h+\b/g, "aw")

    // stretched common words
    .replace(/\b[oO]{2,}kay\b/g, "okay")
    .replace(/\b[yY]+e+s+\b/g, "yes")
    .replace(/\b[nN]+o+\b/g, "no")
    .replace(/\b[sS]+o+\b/g, "so")

    // prevent awkward symbol reading
    .replace(/—/g, ", ")
    .replace(/–/g, ", ")
    .replace(/…/g, "...")

    .replace(/\s+/g, " ")
    .trim();
}

function pickBestVoice() {
  const voices = getVoices();

  if (voices.length === 0) {
    return null;
  }

  const preferredVoiceNames = [
    "Samantha",
    "Victoria",
    "Karen",
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
    const exactMatch = voices.find((voice) => {
      return (
        voice.name.toLowerCase() ===
        preferredName.toLowerCase()
      );
    });

    if (exactMatch) {
      return exactMatch;
    }
  }

  for (const preferredName of preferredVoiceNames) {
    const partialMatch = voices.find((voice) => {
      return voice.name
        .toLowerCase()
        .includes(preferredName.toLowerCase());
    });

    if (partialMatch) {
      return partialMatch;
    }
  }

  const softEnglishVoice = voices.find((voice) => {
    const name = voice.name.toLowerCase();

    return (
      voice.lang.toLowerCase().startsWith("en") &&
      !name.includes("david") &&
      !name.includes("mark") &&
      !name.includes("daniel") &&
      !name.includes("male")
    );
  });

  if (softEnglishVoice) {
    return softEnglishVoice;
  }

  return (
    voices.find((voice) =>
      voice.lang.toLowerCase().startsWith("en")
    ) || voices[0]
  );
}

function splitIntoSpeechChunks(text: string) {
  const cleaned = cleanTextForSpeech(text);

  if (!cleaned) {
    return [];
  }

  const sentenceParts =
    cleaned.match(/[^.!?]+[.!?]?/g) || [cleaned];

  const chunks: string[] = [];

  for (const part of sentenceParts) {
    const sentence = part.trim();

    if (!sentence) {
      continue;
    }

    if (sentence.length <= 180) {
      chunks.push(sentence);
      continue;
    }

    const smallerParts = sentence.split(/,\s+/g);

    let currentChunk = "";

    for (const smallerPart of smallerParts) {
      const nextChunk = currentChunk
        ? `${currentChunk}, ${smallerPart}`
        : smallerPart;

      if (nextChunk.length > 170) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }

        currentChunk = smallerPart;
      } else {
        currentChunk = nextChunk;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  }

  return chunks;
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function getNaturalPause(chunk: string) {
  const basePause =
    chunk.endsWith("?") || chunk.endsWith("!")
      ? 430
      : chunk.endsWith(".")
        ? 380
        : 240;

  const randomExtra = Math.floor(Math.random() * 260);

  return basePause + randomExtra;
}

function speakChunk(
  text: string,
  voice: SpeechSynthesisVoice | null,
  runId: number
) {
  return new Promise<void>((resolve) => {
    if (runId !== currentSpeechRunId) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = "en-US";
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.5;
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

  await preloadVoices();

  const chunks = splitIntoSpeechChunks(text);

  if (chunks.length === 0) {
    return;
  }

  currentSpeechRunId++;

  const runId = currentSpeechRunId;

  window.speechSynthesis.cancel();

  const selectedVoice = pickBestVoice();

  for (const chunk of chunks) {
    if (runId !== currentSpeechRunId) {
      return;
    }

    await speakChunk(chunk, selectedVoice, runId);

    if (runId !== currentSpeechRunId) {
      return;
    }

    await wait(getNaturalPause(chunk));
  }
}