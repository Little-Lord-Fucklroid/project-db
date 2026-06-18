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
  "my dog's",
  "my dogs",
  "my cat",
  "my cat's",
  "my cats",
  "my birthday",
  "remember that",
];

function capitalizeName(name: string) {
  return name
    .trim()
    .replace(/[.!?]+$/, "")
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");
}

function normalizeMemoryText(text: string) {
  const cleanText = text.trim();

  const dogPatterns = [
    /my dog's name is (.+)/i,
    /my dogs name is (.+)/i,
    /my dog is (.+)/i,
    /(.+) is my dog/i,
  ];

  for (const pattern of dogPatterns) {
    const match = cleanText.match(pattern);

    if (match?.[1]) {
      return `My dog's name is ${capitalizeName(match[1])}`;
    }
  }

  const catPatterns = [
    /my cat's name is (.+)/i,
    /my cats name is (.+)/i,
    /my cat is (.+)/i,
    /(.+) is my cat/i,
  ];

  for (const pattern of catPatterns) {
    const match = cleanText.match(pattern);

    if (match?.[1]) {
      return `My cat's name is ${capitalizeName(match[1])}`;
    }
  }

  return cleanText;
}

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
  const cleanText = normalizeMemoryText(text);

  const alreadyExists = memories.some(
    (memory) =>
      normalizeMemoryText(memory.text).toLowerCase() ===
      cleanText.toLowerCase()
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

  const deletedMemory = memories.find(
    (memory) => memory.id === id
  );

  const updatedMemories = memories.filter(
    (memory) => memory.id !== id
  );

  saveMemories(updatedMemories);

  return {
    updatedMemories,
    deletedMemory,
  };
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