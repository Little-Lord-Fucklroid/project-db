import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json(
      { moodTrend: [], stressLevel: "low", sleepQuality: 6.8, dominantMood: { label: "Calm", count: 0 } },
      { status: 200 }
    );
  }
  const userId = authData.user.id;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const { data: moods, error } = await supabase
    .from("mood_entries")
    .select("mood_date, mood, intensity, note")
    .eq("user_id", userId)
    .gte("mood_date", sevenDaysAgoStr)
    .order("mood_date", { ascending: true });

  if (error || !moods || moods.length === 0) {
    return NextResponse.json(
      { moodTrend: [], stressLevel: "low", sleepQuality: 6.8, dominantMood: { label: "Calm", count: 0 } },
      { status: 200 }
    );
  }

  const moodTrend = moods.map((m: any) => ({
    date: m.mood_date,
    mood: m.mood,
    intensity: m.intensity,
  }));

  const avgIntensity = moods.reduce((sum: number, m: any) => sum + (m.intensity || 0), 0) / moods.length;
  const stressLevel = avgIntensity >= 8 ? "high" : avgIntensity <= 4 ? "low" : "medium";

  const sleepQuality = moods.some((m: any) => (m.note || "").toLowerCase().includes("sleep")) ? 7.2 : 6.8;

  const moodCounts: Record<string, number> = {};
  for (const m of moods) {
    const label = (m.mood || "Calm").toLowerCase();
    moodCounts[label] = (moodCounts[label] || 0) + 1;
  }
  const dominantLabel = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "calm";
  const dominantMood = {
    label: dominantLabel.charAt(0).toUpperCase() + dominantLabel.slice(1),
    count: moodCounts[dominantLabel] || 0,
  };

  return NextResponse.json({ moodTrend, stressLevel, sleepQuality, dominantMood });
}
