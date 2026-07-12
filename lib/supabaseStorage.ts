import { supabase } from "./supabaseClient";
import type { Memory } from "./memory";

export type CloudMessage = {
  role: "user" | "ai";
  text: string;
};

async function getUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user.id;
}

export async function getOrCreateConversation() {
  const userId = await getUserId();

  if (!userId) {
    return null;
  }

  const { data: existingConversation, error: selectError } =
    await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (selectError) {
    throw new Error(selectError.message);
  }

  if (existingConversation?.id) {
    return existingConversation.id as string;
  }

  const { data: newConversation, error: insertError } =
    await supabase
      .from("conversations")
      .insert({
        user_id: userId,
        title: "New chat",
      })
      .select("id")
      .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return newConversation.id as string;
}

export async function saveCloudMessage(
  conversationId: string,
  role: "user" | "ai",
  text: string,
  isIncognito: boolean = false  // NEW
) {
  const userId = await getUserId();

  if (!userId) {
    return;
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    user_id: userId,
    role,
    text,
    is_incognito: isIncognito,  // NEW
  });

  if (error) {
    throw new Error(error.message);
  }

  await supabase
    .from("conversations")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .eq("user_id", userId);
}

export async function loadCloudMessages(
  conversationId: string
): Promise<CloudMessage[]> {
  const userId = await getUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("messages")
    .select("role, text")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data.map((message) => ({
    role: message.role as "user" | "ai",
    text: message.text as string,
  }));
}

export async function clearCloudMessages(
  conversationId: string
) {
  const userId = await getUserId();

  if (!userId) {
    return;
  }

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function loadCloudMemories(): Promise<Memory[]> {
  const userId = await getUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("memories")
    .select("id, text, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data.map((memory) => ({
    id: memory.id as string,
    text: memory.text as string,
    createdAt: memory.created_at as string,
  }));
}

export async function saveCloudMemory(text: string) {
  const userId = await getUserId();

  if (!userId) {
    return null;
  }

  const { data: existingMemory, error: selectError } =
    await supabase
      .from("memories")
      .select("id")
      .eq("user_id", userId)
      .ilike("text", text)
      .maybeSingle();

  if (selectError) {
    throw new Error(selectError.message);
  }

  if (existingMemory) {
    return null;
  }

  const { data, error } = await supabase
    .from("memories")
    .insert({
      user_id: userId,
      text,
    })
    .select("id, text, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id as string,
    text: data.text as string,
    createdAt: data.created_at as string,
  };
}

export async function deleteCloudMemory(id: string) {
  const userId = await getUserId();

  if (!userId) {
    return;
  }

  const { error } = await supabase
    .from("memories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function clearCloudMemories() {
  const userId = await getUserId();

  if (!userId) {
    return;
  }

  const { error } = await supabase
    .from("memories")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
export async function createNewCloudConversation() {
  const userId = await getUserId();

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      title: "New chat",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id as string;
}

export async function loadRelevantCloudMessages(
  currentConversationId: string,
  queryText: string
): Promise<CloudMessage[]> {
  const userId = await getUserId();

  if (!userId) {
    return [];
  }

  const stopWords = new Set([
    "what",
    "when",
    "where",
    "why",
    "how",
    "did",
    "does",
    "the",
    "and",
    "you",
    "me",
    "my",
    "your",
    "about",
    "tell",
    "that",
    "this",
    "with",
    "from",
    "have",
    "was",
    "were",
    "are",
    "is",
    "am",
    "do",
    "to",
    "of",
    "in",
    "on",
    "it",
    "i",
    "he",
    "she",
    "him",
    "her",
    "they",
    "them",
  ]);

  const keywords = queryText
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2)
    .filter((word) => !stopWords.has(word))
    .slice(0, 8);

  if (keywords.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("messages")
    .select("conversation_id, role, text, created_at")
    .eq("user_id", userId)
    .neq("conversation_id", currentConversationId)
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    throw new Error(error.message);
  }

  const orderedMessages = data
    .map((message) => ({
      conversationId: message.conversation_id as string,
      role: message.role as "user" | "ai",
      text: message.text as string,
      createdAt: message.created_at as string,
    }))
    .reverse();

  const matchedIndexes = orderedMessages
    .map((message, index) => {
      const lowerText = message.text.toLowerCase();

      const score = keywords.reduce((total, keyword) => {
        return lowerText.includes(keyword) ? total + 1 : total;
      }, 0);

      return {
        index,
        score,
      };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const selectedIndexes = new Set<number>();

  for (const match of matchedIndexes) {
    const matchedMessage = orderedMessages[match.index];

    if (!matchedMessage) {
      continue;
    }

    for (
      let nearbyIndex = match.index - 2;
      nearbyIndex <= match.index + 4;
      nearbyIndex++
    ) {
      const nearbyMessage = orderedMessages[nearbyIndex];

      if (!nearbyMessage) {
        continue;
      }

      if (
        nearbyMessage.conversationId ===
        matchedMessage.conversationId
      ) {
        selectedIndexes.add(nearbyIndex);
      }
    }
  }

  return Array.from(selectedIndexes)
    .sort((a, b) => a - b)
    .slice(0, 24)
    .map((index) => {
      const message = orderedMessages[index];

      return {
        role: message.role,
        text: message.text,
      };
    });
}
export async function loadUserContextSummary() {
  const userId = await getUserId();

  if (!userId) {
    return "";
  }

  const { data, error } = await supabase
    .from("user_context")
    .select("summary")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.summary || "";
}

export async function saveUserContextSummary(summary: string) {
  const userId = await getUserId();

  if (!userId) {
    return;
  }

  const { error } = await supabase
    .from("user_context")
    .upsert(
      {
        user_id: userId,
        summary,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) {
    throw new Error(error.message);
  }
}