export type Memory = {
  id: string;
  text: string;
  createdAt: string;
};

const MEMORY_STORAGE_KEY = "vibe-memories";

const MEMORY_PATTERNS = [
  "my name is",
  "i am",
  "i'm",
  "my favorite",
  "i like",
  "i love",
  "i hate",
  "i have",
  "my dog",
  "my cat",
  "my birthday",
  "remember that",
];

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

export function shouldSaveMemory(text: string) {
  const lowerText = text.toLowerCase();

  return MEMORY_PATTERNS.some((pattern) =>
    lowerText.includes(pattern)
  );
}

export function addMemory(text: string) {
  const memories = loadMemories();
  const cleanText = text.trim();

  const alreadyExists = memories.some(
    (memory) =>
      memory.text.toLowerCase() === cleanText.toLowerCase()
  );

  if (alreadyExists) {
    return null;
  }

  const newMemory: Memory = {
    id: crypto.randomUUID(),
    text: cleanText,
    createdAt: new Date().toISOString(),
  };

  saveMemories([...memories, newMemory]);

  return newMemory;
}

export function deleteMemory(id: string) {
  const memories = loadMemories();
  const updatedMemories = memories.filter(
    (memory) => memory.id !== id
  );

  saveMemories(updatedMemories);
  return updatedMemories;
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