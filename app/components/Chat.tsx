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
  createMemoryFromText,
  deleteMemory,
  loadMemories,
  memoriesToPromptText,
  type Memory,
} from "@/lib/memory";

import {
  clearCloudMemories,
  clearCloudMessages,
  createNewCloudConversation,
  deleteCloudMemory,
  getOrCreateConversation,
  loadCloudMemories,
  loadCloudMessages,
  loadRelevantCloudMessages,
  saveCloudMemory,
  saveCloudMessage,
} from "@/lib/supabaseStorage";

import { preloadVoices, speakText } from "@/lib/voice";
import { startSpeechRecognition } from "@/lib/speechRecognition";
import {
  getCurrentUser,
  signOutUser,
} from "@/lib/supabaseAuth";

type Message = {
  role: "user" | "ai";
  text: string;
};

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<
    string | null
  >(null);

  const [conversationId, setConversationId] = useState<
    string | null
  >(null);

  const [initialDataLoaded, setInitialDataLoaded] =
    useState(false);

  const [screen, setScreen] = useState<
    "start" | "signin" | "chat" | "memory"
  >("start");

  const [incognito, setIncognito] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceScreen, setVoiceScreen] = useState(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function loadInitialData() {
    const user = await getCurrentUser();

    if (user) {
      setCurrentUserId(user.id);
      setScreen("chat");

      const cloudConversationId =
        await getOrCreateConversation();

      if (cloudConversationId) {
        setConversationId(cloudConversationId);

        const cloudMessages =
          await loadCloudMessages(cloudConversationId);

        setMessages(cloudMessages);
      }

      const cloudMemories = await loadCloudMemories();
      setMemories(cloudMemories);

      setInitialDataLoaded(true);
      return;
    }

    setCurrentUserId(null);
    setConversationId(null);
    setMessages(loadSavedMessages());
    setMemories(loadMemories());
    setInitialDataLoaded(true);
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    if (
      initialDataLoaded &&
      !currentUserId &&
      !incognito
    ) {
      saveMessages(messages);
    }
  }, [
    messages,
    incognito,
    currentUserId,
    initialDataLoaded,
  ]);

  async function toggleIncognito() {
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

    if (currentUserId && conversationId) {
      const cloudMessages =
        await loadCloudMessages(conversationId);

      setMessages(cloudMessages);
    } else {
      setMessages(loadSavedMessages());
    }

    setIncognito(false);
  }

function handleLeaveGuest() {
  const shouldLeaveGuest = confirm(
    "Leave guest mode and go back to sign in? Your guest chat will stay saved on this browser."
  );

  if (!shouldLeaveGuest) {
    return;
  }

  setScreen("signin");
}

async function handleNewChat() {
  const shouldStartNewChat = confirm(
    "Start a new chat? Your old chat will stay saved as hidden context, and your memories will stay saved."
  );

  if (!shouldStartNewChat) {
    return;
  }

  setMessages([]);

  if (currentUserId && !incognito) {
    try {
      const newConversationId =
        await createNewCloudConversation();

      if (newConversationId) {
        setConversationId(newConversationId);
      }
    } catch (error) {
      console.error("New cloud chat failed:", error);
    }

    return;
  }

  saveMessages([]);
}

async function handleSignOut() {
  try {
    await signOutUser();
  } catch (error) {
    console.error("Sign out failed:", error);
  }

  setCurrentUserId(null);
  setConversationId(null);
  setIncognito(false);
  setMessages(loadSavedMessages());
  setMemories(loadMemories());
  setScreen("signin");
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

  let activeConversationId = conversationId;

  if (currentUserId && !incognito && !activeConversationId) {
    activeConversationId = await getOrCreateConversation();

    if (activeConversationId) {
      setConversationId(activeConversationId);
    }
  }

  let memoriesForPrompt = memories;

  if (currentUserId && !incognito) {
    const memoryFromText = createMemoryFromText(userMessage);

    if (memoryFromText) {
      try {
        const cloudMemory = await saveCloudMemory(
          memoryFromText.text
        );

        if (cloudMemory) {
          setMemories((prev) => [
            ...prev,
            cloudMemory,
          ]);

          memoriesForPrompt = [
            ...memories,
            cloudMemory,
          ];
        }
      } catch (error) {
        console.error("Cloud memory save failed:", error);
      }
    }
  } else if (!incognito) {
    const newMemory = addMemory(userMessage);

    if (newMemory) {
      setMemories((prev) => [
        ...prev,
        newMemory,
      ]);

      memoriesForPrompt = [
        ...memories,
        newMemory,
      ];
    }
  }

  const nextMessages: Message[] = [
    ...messages,
    {
      role: "user",
      text: userMessage,
    },
  ];

  setMessages(nextMessages);
  setMessage("");
  setLoading(true);

  if (currentUserId && !incognito && activeConversationId) {
    try {
      await saveCloudMessage(
        activeConversationId,
        "user",
        userMessage
      );
    } catch (error) {
      console.error(
        "Cloud user message save failed:",
        error
      );
    }
  }

  const voiceReadyPromise = preloadVoices();

  const minimumThinkingPromise = new Promise<void>(
    (resolve) => {
      setTimeout(resolve, 500);
    }
  );

  try {
    let smartRecallMessage: Message | null = null;

    if (
      currentUserId &&
      !incognito &&
      activeConversationId
    ) {
      try {
        const relevantOldMessages =
          await loadRelevantCloudMessages(
            activeConversationId,
            userMessage
          );

        if (relevantOldMessages.length > 0) {
          const recallText = relevantOldMessages
            .map((oldMessage) => {
              return `${oldMessage.role.toUpperCase()}: ${
                oldMessage.text
              }`;
            })
            .join("\n\n");

          smartRecallMessage = {
            role: "user",
            text: `Hidden relevant past conversation context. Use this only if it helps answer the user's current message. Do not say this context is hidden.\n\n${recallText}`,
          };

          console.log(
            "SMART RECALL:",
            relevantOldMessages.length,
            "old messages found"
          );
        }
      } catch (error) {
        console.error("Smart recall failed:", error);
      }
    }

    const messagesForAi: Message[] = smartRecallMessage
      ? [smartRecallMessage, ...nextMessages]
      : nextMessages;

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memories: memoriesToPromptText(memoriesForPrompt),
        messages: messagesForAi,
      }),
    });

    const data = await response.json();

    console.log("VOICE TEST:", data.reply);
    console.log("AI reply:", data.reply);

    const reply = data.reply || "No response received.";

    if (currentUserId && !incognito && activeConversationId) {
      try {
        await saveCloudMessage(
          activeConversationId,
          "ai",
          reply
        );
      } catch (error) {
        console.error(
          "Cloud AI message save failed:",
          error
        );
      }
    }

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
        onSignIn={() => {
          loadInitialData();
        }}
        onGuest={() => setScreen("chat")}
      />
    );
  }

  if (screen === "memory") {
    return (
      <MemoryScreen
        memories={memories}
        onBack={() => setScreen("chat")}
        onDelete={async (id) => {
          if (currentUserId && !incognito) {
            await deleteCloudMemory(id);

            setMemories((prev) =>
              prev.filter((memory) => memory.id !== id)
            );
          } else {
            const result = deleteMemory(id);

            setMemories(result.updatedMemories);
          }

          const shouldClearChat = confirm(
            "Memory deleted. This fact may still appear in your chat history. Clear chat history too?"
          );

          if (shouldClearChat) {
            setMessages([]);

            if (
              currentUserId &&
              !incognito &&
              conversationId
            ) {
              await clearCloudMessages(conversationId);
            } else {
              saveMessages([]);
            }
          }
        }}
        onClearMemories={async () => {
          setMemories([]);

          if (currentUserId && !incognito) {
            await clearCloudMemories();
          } else {
            clearMemories();
          }
        }}
        onClearChatHistory={async () => {
          setMessages([]);

          if (
            currentUserId &&
            !incognito &&
            conversationId
          ) {
            await clearCloudMessages(conversationId);
          } else {
            saveMessages([]);
          }
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
  onNewChat={handleNewChat}
  onLeaveGuest={handleLeaveGuest}
  memoryCount={memories.length}
  currentUserId={currentUserId}
  incognito={incognito}
  onSignOut={handleSignOut}
/>

        <div
          className="glass-card rounded-[32px] p-6 min-h-[75vh] mb-4"
          style={{
            boxShadow:
              "0 16px 60px rgba(40, 107, 53, 0.08)",
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
          onToggleIncognito={() => {
            toggleIncognito();
          }}
        />
      </div>
    </main>
  );
}