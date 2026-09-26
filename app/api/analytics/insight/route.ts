import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

function countEmotion(text: string): Record<string, number> {
  const lower = text.toLowerCase();
  const emotions: Record<string, number> = { sick: 0, angry: 0, sad: 0, calm: 0, happy: 0 };
  if (lower.includes("sick") || lower.includes("tired") || lower.includes("exhausted")) emotions.sick++;
  if (lower.includes("angry") || lower.includes("mad") || lower.includes("frustrated")) emotions.angry++;
  if (lower.includes("sad") || lower.includes("down") || lower.includes("depressed")) emotions.sad++;
  if (lower.includes("calm") || lower.includes("peace") || lower.includes("relax")) emotions.calm++;
  if (lower.includes("happy") || lower.includes("joy") || lower.includes("excited") || lower.includes("love")) emotions.happy++;
  return emotions;
}

export async function GET() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ emotionBars: { sick: 10, angry: 25, sad: 40, calm: 70, happy: 90 }, dominateMood: { label: "Happy", score: 72 } });
  }
  const userId = authData.user.id;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: messages, error } = await supabase
    .from("messages")
    .select("text, created_at")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !messages || messages.length === 0) {
    return NextResponse.json({ emotionBars: { sick: 10, angry: 25, sad: 40, calm: 70, happy: 90 }, dominateMood: { label: "Happy", score: 72 } });
  }

  const totals = { sick: 0, angry: 0, sad: 0, calm: 0, happy: 0 };
  let totalCounts = 0;
  for (const msg of messages) {
    const counts = countEmotion(msg.text || "");
    for (const [k, v] of Object.entries(counts)) {
      totals[k as keyof typeof totals] += v;
      totalCounts += v;
    }
  }

  const emotionBars = {
    sick: Math.round((totals.sick / Math.max(totalCounts, 1)) * 100) || 10,
    angry: Math.round((totals.angry / Math.max(totalCounts, 1)) * 100) || 25,
    sad: Math.round((totals.sad / Math.max(totalCounts, 1)) * 100) || 40,
    calm: Math.round((totals.calm / Math.max(totalCounts, 1)) * 100) || 70,
    happy: Math.round((totals.happy / Math.max(totalCounts, 1)) * 100) || 90,
  };

  const topEmotion = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  const dominateMood = {
    label: topEmotion ? topEmotion[0].charAt(0).toUpperCase() + topEmotion[0].slice(1) : "Calm",
    score: Math.round((topEmotion ? (topEmotion[1] / Math.max(totalCounts, 1)) * 100 : 50)),
  };

  return NextResponse.json({ emotionBars, dominateMood });
}
