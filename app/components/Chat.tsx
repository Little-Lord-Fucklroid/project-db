"use client";

import { useState, useRef, useEffect } from "react";
import WelcomeScreen from "./screens/WelcomeScreen";
import SignInScreen from "./screens/SignInScreen";
import VoiceScreen from "./screens/VoiceScreen";
import MessageBubble from "./chat/MessageBubble";
import ChatHeader from "./chat/ChatHeader";
import ChatInput from "./chat/ChatInput";

import {
  getIncognitoPin,
  isValidPin,
  loadSavedMessages,
  saveIncognitoPin,
  saveMessages,
} from "@/lib/chatStorage"; 

import { speakText } from "@/lib/voice";
import { startSpeechRecognition } from "@/lib/speechRecognition";

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
  setMessages(loadSavedMessages());
}, []);

useEffect(() => {
  if (!incognito) {
    saveMessages(messages);
  }
}, [messages, incognito]);
function toggleIncognito() {
  const savedPin = getIncognitoPin();

  if (!incognito) {
    if (!savedPin) {
      const newPin = prompt("Create a 4-digit incognito PIN:");

      if (!newPin || !isValidPin(newPin)) {
        alert("PIN must be exactly 4 numbers.");
        return;
      }

      saveIncognitoPin(newPin);
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
  recognitionRef.current = startSpeechRecognition({
    onStart: () => {
      setListening(true);
    },

    onEnd: () => {
      setListening(false);
    },

    onResult: (transcript) => {
      setMessage(transcript);
    },

    onUnsupported: () => {
      alert(
        "Speech recognition is not supported in this browser."
      );
    },
  });
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
  await speakText(data.reply);
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
<ChatInput
  message={message}
  loading={loading}
  listening={listening}
  incognito={incognito}
  onMessageChange={setMessage}
  onSend={sendMessage}
  onOpenVoiceScreen={() => setVoiceScreen(true)}
  onToggleIncognito={toggleIncognito}
/>
      </div>
    </main>
  );
}