"use client";

import { useState, useRef, useEffect } from "react";
import WelcomeScreen from "./screens/WelcomeScreen";
import SignInScreen from "./screens/SignInScreen";
import VoiceScreen from "./screens/VoiceScreen";
import MessageBubble from "./chat/MessageBubble";
import ChatHeader from "./chat/ChatHeader";
import ChatInput from "./chat/ChatInput";
import MemoryScreen from "./screens/MemoryScreen";

import {
  getIncognitoPin,
  isValidPin,
  loadSavedMessages,
  saveIncognitoPin,
  saveMessages,
} from "@/lib/chatStorage"; 

import {
  addMemory,
  clearMemories,
  deleteMemory,
  loadMemories,
  memoriesToPromptText,
  type Memory,
} from "@/lib/memory";

import { preloadVoices, speakText } from "@/lib/voice";
import { startSpeechRecognition } from "@/lib/speechRecognition";

type Message = {
  role: "user" | "ai";
  text: string;
};

export default function Chat() {
  
  const [message, setMessage] = useState("");
const [messages, setMessages] = useState<Message[]>([]);
const [memories, setMemories] = useState<Memory[]>([]);
const [loading, setLoading] = useState(false);

const [screen, setScreen] = useState<
  "start" | "signin" | "chat" | "memory"
>("start");

const [incognito, setIncognito] = useState(false);
const [listening, setListening] = useState(false);
const [voiceScreen, setVoiceScreen] = useState(false);
const recognitionRef = useRef<any>(null);
const messagesEndRef = useRef<HTMLDivElement>(null);
 useEffect(() => {
  setMessages(loadSavedMessages());
  setMemories(loadMemories());
}, []);
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [messages, loading]);

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

  setMessages(loadSavedMessages());
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

  const memoryPatterns = [
    "my name is",
    "i am",
    "i'm",
    "my favorite",
    "i like",
    "i love",
    "i hate",
    "i have",
    "my dog",
    "my cat",
    "my birthday",
    "remember that",
  ];

  const lowerMessage = userMessage.toLowerCase();

 const newMemory = addMemory(userMessage);

if (newMemory) {
  setMemories((prev) => [
    ...prev,
    newMemory,
  ]);
}

  setMessages((prev) => [
    ...prev,
    {
      role: "user",
      text: userMessage,
    },
  ]);

  setMessage("");
  setLoading(true);

  const voiceReadyPromise = preloadVoices();

  const minimumThinkingPromise = new Promise<void>((resolve) => {
    setTimeout(resolve, 500);
  });

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memories: memoriesToPromptText(loadMemories()),
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

    const reply = data.reply || "No response received.";

    await Promise.all([
      voiceReadyPromise,
      minimumThinkingPromise,
    ]);

    setLoading(false);

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: "",
      },
    ]);

    speakText(reply);

    const duration =
      reply.length <= 80
        ? 1000
        : reply.length <= 180
        ? 3000
        : 5000;

    const intervalTime = Math.max(
      15,
      Math.floor(duration / reply.length)
    );

    let index = 0;

    const typingInterval = window.setInterval(() => {
      index++;

      setMessages((prev) => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];

        if (lastMessage?.role === "ai") {
          updated[updated.length - 1] = {
            ...lastMessage,
            text: reply.slice(0, index),
          };
        }

        return updated;
      });

      if (index >= reply.length) {
        window.clearInterval(typingInterval);
      }
    }, intervalTime);
  } catch (error) {
    setLoading(false);

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: "Something went wrong.",
      },
    ]);
  }
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
if (screen === "memory") {
  return (
    <MemoryScreen
      memories={memories}
      onBack={() => setScreen("chat")}
      onDelete={(id) => {
  const result = deleteMemory(id);

  setMemories(result.updatedMemories);

  const shouldClearChat = confirm(
    "Memory deleted. This fact may still appear in your chat history. Clear chat history too?"
  );

  if (shouldClearChat) {
    setMessages([]);
    saveMessages([]);
  }
}}
      onClearMemories={() => {
        clearMemories();
        setMemories([]);
      }}
      onClearChatHistory={() => {
        setMessages([]);
        saveMessages([]);
      }}
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
    <ChatHeader
  onOpenMemory={() => setScreen("memory")}
  memoryCount={memories.length}
/>

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

{loading && (
  <MessageBubble
    role="ai"
    text="✨ Vibe is thinking..."
  />
)}

<div ref={messagesEndRef} />
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