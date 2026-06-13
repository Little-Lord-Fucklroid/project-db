"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "ai";
  text: string;
};

export default function Chat() {
  
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  useEffect(() => {
  const savedMessages = localStorage.getItem("vibe-messages");

  if (savedMessages) {
    setMessages(JSON.parse(savedMessages));
  }
}, []);

useEffect(() => {
  localStorage.setItem(
    "vibe-messages",
    JSON.stringify(messages)
  );
}, [messages]);
function startListening() {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech recognition is not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognitionRef.current = recognition;

  recognition.onstart = () => {
    setListening(true);
  };

  recognition.onend = () => {
    setListening(false);
  };

  recognition.onresult = (event: any) => {
  const transcript = event.results[0][0].transcript;

  setMessage(transcript);

  setTimeout(() => {
    const sendButton = document.querySelector(
      'button:last-of-type'
    ) as HTMLButtonElement | null;

    sendButton?.click();
  }, 300);
};

  recognition.start();
}
  async function sendMessage() {
    if (!message.trim() || loading) return;

    const userMessage = message;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  messages: [
    ...messages,
    {
      role: "user",
      text: userMessage,
    },
  ],
}),
      });

      const data = await response.json();
console.log("VOICE TEST:", data.reply);
console.log("AI reply:", data.reply);
if (data.reply) {
  if (data.reply) {
  // stop any previous voice
  window.speechSynthesis.cancel();

const speechText = data.reply
  .replace(/\bMmmmm+\b/gi, "mmm...")
  .replace(/\bHmmmm+\b/gi, "hmm...");

const utterance = new SpeechSynthesisUtterance(speechText);
  await new Promise<void>((resolve) => {
  const voices = window.speechSynthesis.getVoices();

  if (voices.length) {
    resolve();
  } else {
    window.speechSynthesis.onvoiceschanged = () => resolve();
  }
});

const voices = window.speechSynthesis.getVoices();
console.log(voices.map(v => v.name));
  console.log("AVAILABLE VOICES:", voices);

  // try to pick a female / natural voice
  const preferredVoice =
    voices.find(v =>
      v.name.toLowerCase().includes("aria") ||
      v.name.toLowerCase().includes("jenny") ||
      v.name.toLowerCase().includes("microsoft") ||
      v.name.toLowerCase().includes("female")
    ) || voices.find(v => v.lang.includes("en"));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // make it sound more natural
  utterance.rate = 0.9;   // slower = more human
  utterance.pitch = 1.25; // softer female tone
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}
}
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.reply || "No response received.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Something went wrong.",
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">
        Vibe AI
      </h1>

      <div className="border rounded-lg p-4 min-h-[400px] mb-4">
        {messages.length === 0 && (
          <p>Start chatting...</p>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className="mb-4"
          >
            <strong>
              {msg.role === "user"
                ? "You"
                : "Vibe"}
            </strong>

            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="border p-2 flex-1 rounded"
          placeholder="Type a message..."
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />

        <button
  onClick={startListening}
  className="border px-4 py-2 rounded"
>
  {listening ? "🎤 Listening..." : "🎤"}
</button>

<button
  onClick={sendMessage}
  className="border px-4 py-2 rounded"
>
  Send
</button>
      </div>
    </main>
  );
}