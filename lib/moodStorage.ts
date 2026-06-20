import { supabase } from "./supabaseClient";

export type MoodEntry = {
  id: string;
  mood: string;
  intensity: number;
  note: string | null;
  moodDate: string;
  createdAt: string;
};

function getTodayDate() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - timezoneOffset);

  return localDate.toISOString().slice(0, 10);
}

async function getUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user.id;
}

export async function loadTodayMood() {
  const userId = await getUserId();

  if (!userId) {
    return null;
  }

  const today = getTodayDate();

  const { data, error } = await supabase
    .from("mood_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("mood_date", today)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    mood: data.mood,
    intensity: data.intensity,
    note: data.note,
    moodDate: data.mood_date,
    createdAt: data.created_at,
  } satisfies MoodEntry;
}

export async function saveTodayMood(
  mood: string,
  intensity: number,
  note: string
) {
  const userId = await getUserId();

  if (!userId) {
    return null;
  }

  const today = getTodayDate();

  const { data, error } = await supabase
    .from("mood_entries")
    .upsert(
      {
        user_id: userId,
        mood,
        intensity,
        note: note.trim() || null,
        mood_date: today,
      },
      {
        onConflict: "user_id,mood_date",
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    mood: data.mood,
    intensity: data.intensity,
    note: data.note,
    moodDate: data.mood_date,
    createdAt: data.created_at,
  } satisfies MoodEntry;
}

export function moodToPromptText(mood: MoodEntry | null) {
  if (!mood) {
    return "";
  }

  const noteText = mood.note
    ? `\nMood note: ${mood.note}`
    : "";

  return `
Today's mood check-in:
Mood: ${mood.mood}
Intensity: ${mood.intensity}/5${noteText}
  `.trim();
}