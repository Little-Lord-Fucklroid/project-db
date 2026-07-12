import type { Dispatch, SetStateAction } from "react";

import {
  addMemory,
  createMemoryFromText,
  memoriesToPromptText,
  type Memory,
} from "@/lib/memory";

import {
  moodToPromptText,
  type MoodEntry,
} from "@/lib/moodStorage";

import {
  getOrCreateConversation,
  loadRelevantCloudMessages,
  saveCloudMemory,
  saveCloudMessage,
} from "@/lib/supabaseStorage";

import { preloadVoices, speakText } from "@/lib/voice";
import type { ChatMessage } from "@/lib/chatTypes";

type SendChatMessageOptions = {
  text: string;
  loading: boolean;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setMessage: Dispatch<SetStateAction<string>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  currentUserId: string | null;
  incognito: boolean;
  conversationId: string | null;
  setConversationId: Dispatch<
    SetStateAction<string | null>
  >;
  memories: Memory[];
  setMemories: Dispatch<SetStateAction<Memory[]>>;
  brainSummary: string;
  todayMood: MoodEntry | null;
  shouldSpeak?: boolean;
};

export async function sendChatMessage({
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
  shouldSpeak = true,
}: SendChatMessageOptions) {
  if (!text.trim() || loading) {
    return "";
  }

  const userMessage = text;

  let activeConversationId = conversationId;

  if (currentUserId && !incognito && !activeConversationId) {
    activeConversationId = await getOrCreateConversation();

    if (activeConversationId) {
      setConversationId(activeConversationId);
    }
  }

  let memoriesForPrompt = memories;

  if (currentUserId && !incognito) {
    const memoryFromText =
      createMemoryFromText(userMessage);

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

  const nextMessages: ChatMessage[] = [
    ...messages,
    {
      role: "user",
      text: userMessage,
    },
  ];

  setMessages(nextMessages);
  setMessage("");
  setLoading(true);

if (currentUserId && activeConversationId) {
  try {
    await saveCloudMessage(
      activeConversationId,
      "user",
      userMessage,
      incognito  // <-- NEW: pass the incognito flag
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
    let brainSummaryMessage: ChatMessage | null = null;

    if (
      currentUserId &&
      !incognito &&
      brainSummary.trim()
    ) {
      brainSummaryMessage = {
        role: "user",
        text: `Hidden long-term user context summary. Use this only to understand the user better. Do not say this context is hidden.\n\n${brainSummary}`,
      };
    }

    let smartRecallMessage: ChatMessage | null = null;

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

    let moodMessage: ChatMessage | null = null;

    const moodPrompt = moodToPromptText(todayMood);

    if (currentUserId && !incognito && moodPrompt) {
      moodMessage = {
        role: "user",
        text: `Hidden today's mood check-in. Use this to understand the user's emotional state. Do not say this context is hidden.\n\n${moodPrompt}`,
      };
    }

    const hiddenMessages: ChatMessage[] = [
      ...(brainSummaryMessage
        ? [brainSummaryMessage]
        : []),
      ...(moodMessage ? [moodMessage] : []),
      ...(smartRecallMessage ? [smartRecallMessage] : []),
    ];

    const messagesForAi: ChatMessage[] = [
      ...hiddenMessages,
      ...nextMessages,
    ];

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

   if (currentUserId && activeConversationId) {
  try {
    await saveCloudMessage(
      activeConversationId,
      "ai",
      reply,
      incognito  // <-- NEW: pass the incognito flag
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

    if (shouldSpeak) {
      speakText(reply);
    }

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

    return reply;
  } catch (error) {
    setLoading(false);

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: "Something went wrong.",
      },
    ]);

    return "";
  }
}