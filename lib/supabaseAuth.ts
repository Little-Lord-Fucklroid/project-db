import { supabase } from "./supabaseClient";

async function ensureUserProfile(
  id: string,
  email: string | undefined
) {
  await supabase.from("profiles").upsert(
    {
      id,
      email,
    },
    {
      onConflict: "id",
    }
  );
}

export async function signUpWithEmail(
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.user) {
    await ensureUserProfile(data.user.id, data.user.email);
  }

  return data.user;
}

export async function signInWithEmail(
  email: string,
  password: string
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    throw new Error(error.message);
  }

  if (data.user) {
    await ensureUserProfile(data.user.id, data.user.email);
  }

  return data.user;
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
redirectTo: window.location.origin,    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  await ensureUserProfile(data.user.id, data.user.email);

  return data.user;
}