"use client";
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

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

const guestMessageCount = messages.filter((m) => m.role === "user").length;

const guestLimitReached = (() => {
  const result = initialDataLoaded && !currentUserId && guestMessageCount >= GUEST_MESSAGE_LIMIT;
  
  // --- DEBUG ---
  console.log("🔍 DEBUG guestLimitReached:", {
    initialDataLoaded,
    currentUserId,
    guestMessageCount,
    limit: GUEST_MESSAGE_LIMIT,
    result,
  });
  // --- END DEBUG ---
  
  return result;
})();

  // --- MODIFIED: loadInitialData sets screen to loading, then after data loads, sets the final screen ---
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

  // --- Determine final screen ---
  if (data.currentUserId) {
    // Logged in: go to mood if needed, else chat
    setScreen(data.nextScreen || "chat");
  } else {
    // Guest: go to start (welcome) screen
    setScreen("start");
  }

  setInitialDataLoaded(true);
}

  useEffect(() => {
  // Show loading immediately on mount
  setScreen("loading");
  loadInitialData();
}, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (initialDataLoaded && !currentUserId && !incognito) {
      saveMessages(messages);
    }
  }, [messages, incognito, currentUserId, initialDataLoaded]);

  // Save incognito messages separately
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

  async function toggleIncognito() {
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
  // --- HARD CHECK: if user is signed in, never limit ---
  const { data: { user } } = await supabase.auth.getUser();
  const isActuallySignedIn = !!user;

  // If signed in, skip limit entirely
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

  // Guest limit logic (only for non‑signed‑in users)
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

  // --- RENDER LOGIC ---

  // Show loading screen
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
          // When user signs in, show loading screen immediately
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
      />
    </>
  );
}