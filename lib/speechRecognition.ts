type StartSpeechRecognitionOptions = {
  onStart: () => void;
  onEnd: () => void;
  onResult: (transcript: string) => void;
  onUnsupported: () => void;
};

export function startSpeechRecognition({
  onStart,
  onEnd,
  onResult,
  onUnsupported,
}: StartSpeechRecognitionOptions) {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onUnsupported();
    return null;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = onStart;
  recognition.onend = onEnd;

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.start();

  return recognition;
}