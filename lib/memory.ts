export type Memory = {
  id: string;
  text: string;
  createdAt: string;
};

const MEMORY_STORAGE_KEY = "vibe-memories";

export function loadMemories(): Memory[] {
  try {
    const savedMemories = localStorage.getItem(MEMORY_STORAGE_KEY);

    if (!savedMemories) {
      return [];
    }

    return JSON.parse(savedMemories);
  } catch {
    return [];
  }
}

export function saveMemories(memories: Memory[]) {
  localStorage.setItem(
    MEMORY_STORAGE_KEY,
    JSON.stringify(memories)
  );
}

export function addMemory(text: string) {
  const memories = loadMemories();

  const newMemory: Memory = {
    id: crypto.randomUUID(),
    text,
    createdAt: new Date().toISOString(),
  };

  saveMemories([...memories, newMemory]);

  return newMemory;
}

export function clearMemories() {
  localStorage.removeItem(MEMORY_STORAGE_KEY);
}

export function memoriesToPromptText(memories: Memory[]) {
  if (memories.length === 0) {
    return "";
  }

  return memories
    .map((memory) => `- ${memory.text}`)
    .join("\n");
}