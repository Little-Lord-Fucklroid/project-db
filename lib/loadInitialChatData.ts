import {
  loadSavedMessages,
} from "@/lib/chatStorage";

import {
  loadMemories,
  type Memory,
} from "@/lib/memory";

import {
  loadTodayMood,
  type MoodEntry,
} from "@/lib/moodStorage";

import {
  getOrCreateConversation,
  loadCloudMemories,
  loadCloudMessages,
  loadUserContextSummary,
} from "@/lib/supabaseStorage";

import { getCurrentUser } from "@/lib/supabaseAuth";
import type { ChatMessage } from "@/lib/chatTypes";

export type InitialChatData = {
  currentUserId: string | null;
  conversationId: string | null;
  messages: ChatMessage[];
  memories: Memory[];
  brainSummary: string;
  todayMood: MoodEntry | null;
  nextScreen: "chat" | "mood" | null;
};

export async function loadInitialChatData(): Promise<InitialChatData> {
  const user = await getCurrentUser();

  if (user) {
    const cloudConversationId =
      await getOrCreateConversation();

    let cloudMessages: ChatMessage[] = [];

    if (cloudConversationId) {
      cloudMessages =
        await loadCloudMessages(cloudConversationId);
    }

    const cloudMemories = await loadCloudMemories();

    const cloudBrainSummary =
      await loadUserContextSummary();

    const existingMood = await loadTodayMood();

    return {
      currentUserId: user.id,
      conversationId: cloudConversationId,
      messages: cloudMessages,
      memories: cloudMemories,
      brainSummary: cloudBrainSummary,
      todayMood: existingMood,
      nextScreen: existingMood ? "chat" : "mood",
    };
  }

  return {
    currentUserId: null,
    conversationId: null,
    messages: loadSavedMessages(),
    memories: loadMemories(),
    brainSummary: "",
    todayMood: null,
    nextScreen: null,
  };
}