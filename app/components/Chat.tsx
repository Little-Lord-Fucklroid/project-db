"use client";

import { useState, useRef, useEffect } from "react";
import WelcomeScreen from "./screens/WelcomeScreen";
import SignInScreen from "./screens/SignInScreen";
import VoiceScreen from "./screens/VoiceScreen";
import ChatShell from "./chat/ChatShell";
import MemoryScreenController from "./chat/MemoryScreenController";
import MoodCheckScreen from "./screens/MoodCheckScreen";
import IncognitoPinModal from "./IncognitoPinModal";
import ConfirmModal from "./ConfirmModal"; // NEW
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
    "start" | "signin" | "chat" | "memory" | "mood"
  >("start");

  const [incognito, setIncognito] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceScreen, setVoiceScreen] = useState(false);

  // PIN modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<"create" | "unlock">("create");
  const [pinError, setPinError] = useState("");

  // --- NEW: Confirmation modal state ---
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

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function loadInitialData() {
    const data = await loadInitialChatData();
    setCurrentUserId(data.currentUserId);
    setConversationId(data.conversationId);
    setMessages(data.messages);
    setMemories(data.memories);
    setBrainSummary(data.brainSummary);
    setTodayMood(data.todayMood);
    if (data.nextScreen) {
      setScreen(data.nextScreen);
    }
    setInitialDataLoaded(true);
  }

  useEffect(() => {
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

  // --- REPLACED: handleLeaveGuest now uses the confirmation modal ---
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

  // --- REPLACED: handleNewChat now uses the confirmation modal ---
  async function handleNewChat() {
    setConfirmConfig({
      title: "Start New Chat?",
      message:
        "Your old chat will stay saved, summarized, and available as hidden context. You can return to it later.",
      onConfirm: async () => {
        setShowConfirm(false);

        // Original logic from handleNewChat
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
    await sendChatMessage({
      text: message,
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

  // --- RENDER LOGIC ---
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
        onSignIn={() => loadInitialData()}
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
      {/* PIN Modal */}
      {showPinModal && (
        <IncognitoPinModal
          mode={pinModalMode}
          error={pinError}
          onSuccess={handlePinSubmit}
          onCancel={handlePinCancel}
        />
      )}

      {/* NEW: Confirmation Modal */}
      {showConfirm && (
        <ConfirmModal
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmLabel="Yes, continue"
          cancelLabel="Cancel"
          onConfirm={() => {
            confirmConfig.onConfirm();
            // The onConfirm callback will setShowConfirm(false) itself
          }}
          onCancel={() => setShowConfirm(false)}
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
        onOpenMemory={() => setScreen("memory")}
        onNewChat={handleNewChat}
        onLeaveGuest={handleLeaveGuest}
        onSignOut={handleSignOut}
        onMessageChange={setMessage}
        onSend={sendMessage}
        onOpenVoiceScreen={() => setVoiceScreen(true)}
        onToggleIncognito={toggleIncognito}
      />
    </>
  );
}