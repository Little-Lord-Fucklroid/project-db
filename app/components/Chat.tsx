"use client";
import { prewarmTts } from "@/lib/voice";
import { supabase } from "@/lib/supabaseClient";
import { useState, useRef, useEffect } from "react";
import WelcomeScreen from "./screens/WelcomeScreen";
import SignInScreen from "./screens/SignInScreen";
import VoiceScreen from "./screens/VoiceScreen";
import ChatShell from "./chat/ChatShell";
import MemoryScreenController from "./chat/MemoryScreenController";
import MoodCheckScreen from "./screens/MoodCheckScreen";
import IncognitoPinModal from "./IncognitoPinModal";
import ConfirmModal from "./ConfirmModal";
import type { ChatMessage } from "@/lib/chatTypes";
import { sendChatMessage } from "@/lib/sendChatMessage";
import { loadInitialChatData } from "@/lib/loadInitialChatData";

import {
  getIncognitoPin,
  isValidPin,
  loadSavedMessages,
  saveIncognitoPin,
  saveMessages,
} from "@/lib/chatStorage";

import { loadMemories, type Memory } from "@/lib/memory";
import type { MoodEntry } from "@/lib/moodStorage";

import {
  createNewCloudConversation,
  loadCloudMessages,
  saveUserContextSummary,
} from "@/lib/supabaseStorage";

import { startSpeechRecognition } from "@/lib/speechRecognition";
import { signOutUser } from "@/lib/supabaseAuth";

// --- ICEBREAKER PROMPTS (60) ---
const ICEBREAKERS = [
  "What's been on your mind lately?",
  "Tell me something you're curious about right now.",
  "How are you really feeling today?",
  "What's something you've been overthinking?",
  "What's a small thing that made you smile recently?",
  "If you could change one thing about today, what would it be?",
  "What's something you're proud of but don't talk about?",
  "What's a question you've been asking yourself lately?",
  "What's a memory that feels warm to you right now?",
  "What's something you wish more people understood about you?",
  "What's a feeling you've been carrying around?",
  "What's something you're looking forward to?",
  "What's a decision you're trying to make?",
  "What's a conversation you wish you could have?",
  "What's something you've been avoiding?",
  "What's a small pleasure you enjoyed recently?",
  "What's a thought that keeps coming back to you?",
  "What's something you'd tell your younger self?",
  "What's a fear that's been showing up?",
  "What's something you're learning about yourself?",
  "What's a moment that felt like you?",
  "What's something you wish you could say out loud?",
  "What's a recent moment that surprised you?",
  "What's something you're holding onto?",
  "What's a change you've been thinking about?",
  "What's something you want to understand better?",
  "What's a dream you remember vividly?",
  "What's something you're grateful for that you don't mention?",
  "What's a quiet moment you've had recently?",
  "What's something you've been meaning to do?",
  "What's a question that's hard to ask?",
  "What's something you're hoping for?",
  "What's a memory that makes you feel something?",
  "What's something you've never told anyone?",
  "What's a word that describes how you feel right now?",
  "What's something that calms you down?",
  "What's a place you feel safe?",
  "What's something you'd like to let go of?",
  "What's a moment you wish you could re‑live?",
  "What's something you're curious about but haven't explored?",
  "What's a feeling you don't have a name for?",
  "What's something you've been working through?",
  "What's a quiet truth about you?",
  "What's something that makes you feel understood?",
  "What's a thought that feels too big to say?",
  "What's something you're ready to admit?",
  "What's a small thing you're proud of?",
  "What's a relationship that matters to you right now?",
  "What's something you're afraid of losing?",
  "What's a question you've been meaning to ask yourself?",
  "What's something that feels unresolved?",
  "What's a moment that changed you?",
  "What's something you wish you could explain better?",
  "What's a feeling you've been avoiding?",
  "What's something that made you feel alive recently?",
  "What's a story you haven't told?",
  "What's something you need to hear right now?",
  "What's a thought that feels like a relief?",
  "What's something you're beginning to understand?",
  "What's a quiet hope you have?",
  "What's a conversation you'd like to have with yourself?",
];

function getRandomIcebreaker() {
  return ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)];
}

const GUEST_MESSAGE_LIMIT = 7;

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [brainSummary, setBrainSummary] = useState("");
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const [screen, setScreen] = useState<
    "start" | "signin" | "chat" | "memory" | "mood" | "loading"
  >("start");

  const [incognito, setIncognito] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceScreen, setVoiceScreen] = useState(false);

  // PIN modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<"create" | "unlock">("create");
  const [pinError, setPinError] = useState("");

  // Confirmation modal state
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Guest limit modal state
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false);

  // --- NEW: Incognito guest modal state ---
  const [showIncognitoGuestModal, setShowIncognitoGuestModal] = useState(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const guestMessageCount = messages.filter((m) => m.role === "user").length;

  const guestLimitReached = (() => {
    const result = initialDataLoaded && !currentUserId && guestMessageCount >= GUEST_MESSAGE_LIMIT;
    console.log("🔍 DEBUG guestLimitReached:", {
      initialDataLoaded,
      currentUserId,
      guestMessageCount,
      limit: GUEST_MESSAGE_LIMIT,
      result,
    });
    return result;
  })();

  // --- loadInitialData ---
  async function loadInitialData(showLoading = false) {
    if (showLoading) {
      setScreen("loading");
    }

    const data = await loadInitialChatData();

    setCurrentUserId(data.currentUserId);
    setConversationId(data.conversationId);
    setMessages(data.messages);
    setMemories(data.memories);
    setBrainSummary(data.brainSummary);
    setTodayMood(data.todayMood);

    if (data.currentUserId) {
      setScreen(data.nextScreen || "chat");
    } else {
      setScreen("start");
    }

    setInitialDataLoaded(true);
  }

  useEffect(() => {
    setScreen("loading");
    loadInitialData();
    prewarmTts();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (initialDataLoaded && !currentUserId && !incognito) {
      saveMessages(messages);
    }
  }, [messages, incognito, currentUserId, initialDataLoaded]);

  useEffect(() => {
    if (initialDataLoaded && incognito) {
      localStorage.setItem("incognito_messages", JSON.stringify(messages));
    }
  }, [messages, incognito, initialDataLoaded]);

  useEffect(() => {
    if (incognito && initialDataLoaded) {
      const saved = localStorage.getItem("incognito_messages");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMessages(parsed);
        } catch (e) {}
      }
    }
  }, [incognito, initialDataLoaded]);

  // --- PIN modal handlers ---
  function handlePinSubmit(pin: string) {
    const savedPin = getIncognitoPin();

    if (pinModalMode === "create") {
      if (!isValidPin(pin)) {
        setPinError("PIN must be exactly 4 numbers.");
        return;
      }
      saveIncognitoPin(pin);
      setIncognito(true);
      setMessages([]);
      setShowPinModal(false);
      setPinError("");
      alert("Incognito mode created and unlocked.");
    } else {
      if (pin === savedPin) {
        setIncognito(true);
        setMessages([]);
        setShowPinModal(false);
        setPinError("");
      } else {
        setPinError("Wrong PIN. Please try again.");
      }
    }
  }

  function handlePinCancel() {
    setShowPinModal(false);
    setPinError("");
  }

  // --- CORRECTED: toggleIncognito uses currentUserId to prevent guest incognito ---
  async function toggleIncognito() {
    // If user is not signed in (guest), show the modal and return
    if (!currentUserId) {
      setShowIncognitoGuestModal(true);
      return;
    }

    // Signed‑in user – proceed with normal incognito logic
    const savedPin = getIncognitoPin();

    if (!incognito) {
      if (!savedPin) {
        setPinModalMode("create");
        setPinError("");
        setShowPinModal(true);
      } else {
        setPinModalMode("unlock");
        setPinError("");
        setShowPinModal(true);
      }
      return;
    }

    // Turning incognito OFF
    if (currentUserId && conversationId) {
      const cloudMessages = await loadCloudMessages(conversationId);
      setMessages(cloudMessages);
    } else {
      setMessages(loadSavedMessages());
    }
    setIncognito(false);
  }

  function handleLeaveGuest() {
    setConfirmConfig({
      title: "Leave Guest Mode?",
      message: "Your guest chat will stay saved on this browser. You can return to it later.",
      onConfirm: () => {
        setScreen("signin");
        setShowConfirm(false);
      },
    });
    setShowConfirm(true);
  }

  async function handleNewChat() {
    setConfirmConfig({
      title: "Start New Chat?",
      message:
        "Your old chat will stay saved, summarized, and available as hidden context. You can return to it later.",
      onConfirm: async () => {
        setShowConfirm(false);

        if (currentUserId && !incognito && messages.length > 0) {
          try {
            const response = await fetch("/api/summarize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ existingSummary: brainSummary, messages }),
            });
            const data = await response.json();
            if (data.summary) {
              await saveUserContextSummary(data.summary);
              setBrainSummary(data.summary);
            }
          } catch (error) {
            console.error("Brain summary failed:", error);
          }
        }

        setMessages([]);
        if (currentUserId && !incognito) {
          try {
            const newConversationId = await createNewCloudConversation();
            if (newConversationId) {
              setConversationId(newConversationId);
            }
          } catch (error) {
            console.error("New cloud chat failed:", error);
          }
          return;
        }
        saveMessages([]);
      },
    });
    setShowConfirm(true);
  }

  async function handleSignOut() {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
    setCurrentUserId(null);
    setConversationId(null);
    setBrainSummary("");
    setTodayMood(null);
    setIncognito(false);
    setMessages(loadSavedMessages());
    setMemories(loadMemories());
    setScreen("signin");
  }

  function startListening() {
    recognitionRef.current = startSpeechRecognition({
      onStart: () => setListening(true),
      onEnd: () => setListening(false),
      onResult: (transcript) => setMessage(transcript),
      onUnsupported: () =>
        alert("Speech recognition is not supported in this browser."),
    });
  }

  async function sendMessage() {
    const { data: { user } } = await supabase.auth.getUser();
    const isActuallySignedIn = !!user;

    if (isActuallySignedIn) {
      const text = message.trim();
      if (!text) return;
      await sendChatMessage({
        text,
        loading,
        messages,
        setMessages,
        setMessage,
        setLoading,
        currentUserId,
        incognito,
        conversationId,
        setConversationId,
        memories,
        setMemories,
        brainSummary,
        todayMood,
        shouldSpeak: true,
      });
      return;
    }

    if (guestLimitReached) {
      setShowGuestLimitModal(true);
      return;
    }

    const text = message.trim();
    if (!text) return;

    const newCount = guestMessageCount + 1;

    if (newCount >= GUEST_MESSAGE_LIMIT) {
      setMessages((prev) => [...prev, { role: "user", text }]);
      setMessage("");
      setShowGuestLimitModal(true);
      return;
    }

    await sendChatMessage({
      text,
      loading,
      messages,
      setMessages,
      setMessage,
      setLoading,
      currentUserId,
      incognito,
      conversationId,
      setConversationId,
      memories,
      setMemories,
      brainSummary,
      todayMood,
      shouldSpeak: true,
    });
  }

  function handleGuestLimitSignIn() {
    setShowGuestLimitModal(false);
    setScreen("signin");
  }

  // --- Icebreaker handler ---
  function handleIcebreaker() {
    const prompt = getRandomIcebreaker();
    setMessage(prompt);
    setTimeout(() => {
      sendMessage();
    }, 100);
  }

  function handleIncognitoGuestSignIn() {
    setShowIncognitoGuestModal(false);
    setScreen("signin");
  }

  // --- RENDER LOGIC ---
  if (screen === "loading") {
    return (
      <main
        className="min-h-screen w-full flex items-center justify-center relative"
        style={{ background: "#f7faf3" }}
      >
        <div className="mesh-bg" />
        <div className="light-ray opacity-30" />
        <div className="flex flex-col items-center z-10">
          <div className="relative w-32 h-32">
            <div
              className="absolute inset-0 rounded-full pulse-orb"
              style={{
                background: "rgba(136,206,141,0.3)",
                filter: "blur(40px)",
              }}
            />
            <img
              src="/mine_heart.png"
              alt="Loading"
              className="shimmer-heart w-full h-full object-contain relative z-1"
              style={{ filter: "drop-shadow(0 16px 40px rgba(144,215,149,0.5))" }}
            />
          </div>
          <p className="mt-6 text-sm font-bold text-[#286b35] tracking-widest uppercase">
            Loading your vibe...
          </p>
        </div>
      </main>
    );
  }

  if (voiceScreen) {
    return <VoiceScreen onBack={() => setVoiceScreen(false)} />;
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
        onSignIn={() => {
          loadInitialData(true);
        }}
        onGuest={() => setScreen("chat")}
      />
    );
  }

  if (screen === "mood") {
    return (
      <MoodCheckScreen
        onComplete={(mood) => {
          setTodayMood(mood);
          setScreen("chat");
        }}
      />
    );
  }

  if (screen === "memory") {
    return (
      <MemoryScreenController
        memories={memories}
        setMemories={setMemories}
        setMessages={setMessages}
        currentUserId={currentUserId}
        incognito={incognito}
        conversationId={conversationId}
        onBack={() => setScreen("chat")}
      />
    );
  }

  // Main chat screen
  return (
    <>
      {showPinModal && (
        <IncognitoPinModal
          mode={pinModalMode}
          error={pinError}
          onSuccess={handlePinSubmit}
          onCancel={handlePinCancel}
        />
      )}

      {showConfirm && (
        <ConfirmModal
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmLabel="Yes, continue"
          cancelLabel="Cancel"
          onConfirm={() => {
            confirmConfig.onConfirm();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {showGuestLimitModal && (
        <ConfirmModal
          title="Guest Limit Reached"
          message="You've reached the maximum of 7 messages in guest mode. Please sign in to continue chatting."
          confirmLabel="Sign In"
          cancelLabel="Close"
          onConfirm={handleGuestLimitSignIn}
          onCancel={() => setShowGuestLimitModal(false)}
        />
      )}

      {showIncognitoGuestModal && (
        <ConfirmModal
          title="Sign In Required"
          message="Incognito mode is available for signed-in users. Please sign in to use this feature."
          confirmLabel="Sign In"
          cancelLabel="Cancel"
          onConfirm={handleIncognitoGuestSignIn}
          onCancel={() => setShowIncognitoGuestModal(false)}
        />
      )}

      <ChatShell
        messages={messages}
        loading={loading}
        message={message}
        listening={listening}
        incognito={incognito}
        memoryCount={memories.length}
        currentUserId={currentUserId}
        messagesEndRef={messagesEndRef}
        guestLimitReached={guestLimitReached}
        onOpenMemory={() => setScreen("memory")}
        onNewChat={handleNewChat}
        onLeaveGuest={handleLeaveGuest}
        onSignOut={handleSignOut}
        onMessageChange={setMessage}
        onSend={sendMessage}
        onOpenVoiceScreen={() => setVoiceScreen(true)}
        onToggleIncognito={toggleIncognito}
        onGuestLimitSignIn={handleGuestLimitSignIn}
        onIcebreaker={handleIcebreaker}
      />
    </>
  );
}