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
  text: string
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