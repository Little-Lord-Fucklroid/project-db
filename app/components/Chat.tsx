"use client";

import { useState, useRef, useEffect } from "react";
import WelcomeScreen from "./screens/WelcomeScreen";
import SignInScreen from "./screens/SignInScreen";
import VoiceScreen from "./screens/VoiceScreen";
import MessageBubble from "./chat/MessageBubble";
import ChatHeader from "./chat/ChatHeader";

type Message = {
  role: "user" | "ai";
  text: string;
};

export default function Chat() {
  
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<"start" | "signin" | "chat">("start");
  const [incognito, setIncognito] = useState(false);

  const [listening, setListening] = useState(false);
  const [voiceScreen, setVoiceScreen] = useState(false);
  const recognitionRef = useRef<any>(null);
  useEffect(() => {
  const savedMessages = localStorage.getItem("vibe-messages");

  if (savedMessages) {
    setMessages(JSON.parse(savedMessages));
  }
}, []);

useEffect(() => {
  if (!incognito) {
    localStorage.setItem(
      "vibe-messages",
      JSON.stringify(messages)
    );
  }
}, [messages, incognito]);
function toggleIncognito() {
  const savedPin = localStorage.getItem("vibe-incognito-pin");

  if (!incognito) {
    if (!savedPin) {
      const newPin = prompt("Create a 4-digit incognito PIN:");

      if (!newPin || !/^\d{4}$/.test(newPin)) {
        alert("PIN must be exactly 4 numbers.");
        return;
      }

      localStorage.setItem("vibe-incognito-pin", newPin);
      setMessages([]);
      setIncognito(true);
      alert("Incognito mode created and unlocked.");
      return;
    }

    const enteredPin = prompt("Enter your incognito PIN:");

    if (enteredPin !== savedPin) {
      alert("Wrong PIN.");
      return;
    }

    setMessages([]);
    setIncognito(true);
    return;
  }

  setMessages([]);
  setIncognito(false);
}
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
  utterance.pitch = 1.15; // softer female tone
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
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
 if (voiceScreen) {
  return (
    <VoiceScreen
      onBack={() => setVoiceScreen(false)}
    />
  );
}
if (screen === "start") {
  return (
    <WelcomeScreen
      onGetStarted={() => setScreen("signin")}
      onSignIn={() => setScreen("signin")}
    />
  );
}
if (screen === "signin") {
  return (
    <SignInScreen
      onBack={() => setScreen("start")}
      onSignIn={() => setScreen("chat")}
      onGuest={() => setScreen("chat")}
    />
  );
}
  return (
    <main
 className="min-h-screen flex justify-center p-5 relative"
  style={{ background: "#f7faf3" }}
>
  <div className="mesh-bg" />
  <div className="light-ray opacity-20" />

      <div className="w-full max-w-4xl">
     <ChatHeader />

      <div
  className="glass-card rounded-[32px] p-6 min-h-[75vh] mb-4"
  style={{
    boxShadow: "0 16px 60px rgba(40, 107, 53, 0.08)",
  }}
>
        {messages.length === 0 && (
          <p>Start chatting...</p>
        )}
{messages.map((msg, index) => (
  <MessageBubble
    key={index}
    role={msg.role}
    text={msg.text}
  />
))}
      </div>
<div className="sticky bottom-4 z-50 bg-white/90 backdrop-blur border border-pink-100 rounded-3xl shadow-lg p-3 flex gap-2">
        <input
         className="bg-pink-50 text-black placeholder:text-gray-500 border border-pink-100 p-3 flex-1 rounded-2xl outline-none focus:ring-2 focus:ring-pink-200"
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
  onClick={() => setVoiceScreen(true)}
  className={`px-4 py-3 rounded-2xl shadow-sm transition ${
    listening
      ? "bg-pink-500 text-white"
      : "bg-white border border-pink-100 text-pink-600 hover:bg-pink-50"
  }`}
>
  {listening ? "Listening..." : "🎤"}
</button>

<button
  onClick={toggleIncognito}
  className="bg-white text-black border border-gray-300 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50"
>
  {incognito ? "🌙 Exit Incognito" : "🌙 Incognito"}
</button>

<button
  onClick={sendMessage}
  className="bg-pink-500 text-white px-6 py-3 rounded-2xl shadow-md hover:bg-pink-600 transition disabled:opacity-50"
  disabled={loading}
>
  {loading ? "..." : "Send"}
</button>
      </div>
      </div>
    </main>
  );
}