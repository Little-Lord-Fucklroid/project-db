export type Memory = {
  id: string;
  text: string;
  createdAt: string;
};

const MEMORY_STORAGE_KEY = "vibe-memories";

function cleanEnding(text: string) {
  return text
    .trim()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[.!?]+$/, "");
}

function capitalizeName(name: string) {
  return cleanEnding(name)
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");
}

function capitalizeValue(value: string) {
  const cleaned = cleanEnding(value);

  if (!cleaned) {
    return cleaned;
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function extractMemoryFact(text: string) {
  const cleanText = cleanEnding(text);

  const namePatterns = [
    /my name is (.+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = cleanText.match(pattern);

    if (match?.[1]) {
      return `User's name: ${capitalizeName(match[1])}`;
    }
  }

  const dogPatterns = [
    /my dog's name is (.+)/i,
    /my dogs name is (.+)/i,
    /my dog is (.+)/i,
    /(.+) is my dog/i,
    /(.+) is the name of my dog/i,
  ];

  for (const pattern of dogPatterns) {
    const match = cleanText.match(pattern);

    if (match?.[1]) {
      return `Dog's name: ${capitalizeName(match[1])}`;
    }
  }

  const catPatterns = [
    /my cat's name is (.+)/i,
    /my cats name is (.+)/i,
    /my cat is (.+)/i,
    /(.+) is my cat/i,
    /(.+) is the name of my cat/i,
  ];

   const personRelations = [
    "friend",
    "best friend",
    "girlfriend",
    "gf",
    "boyfriend",
    "bf",
    "wife",
    "husband",
    "mother",
    "mom",
    "father",
    "dad",
    "parent",
    "brother",
    "sister",
    "sibling",
    "cousin",
    "uncle",
    "aunt",
    "teacher",
    "doctor",
    "therapist",
    "boss",
    "manager",
    "coworker",
    "classmate",
    "neighbor",
    "crush",
    "ex",
    "enemy",
    "stranger",
  ];

  const relationAliases: Record<string, string> = {
    gf: "girlfriend",
    bf: "boyfriend",
    mom: "mother",
    dad: "father",
  };

  function normalizeRelation(relation: string) {
    const cleanedRelation = relation
      .trim()
      .toLowerCase()
      .replace(/'s$/, "")
      .replace(/\s+/g, " ");

    return relationAliases[cleanedRelation] || cleanedRelation;
  }

  function formatRelation(relation: string) {
    return normalizeRelation(relation)
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  }

  function isPersonRelation(relation: string) {
    return personRelations.includes(normalizeRelation(relation));
  }

  const relationNamePatterns = [
    /^my (.+?)'s name is (.+)/i,
    /^my (.+?)s name is (.+)/i,
    /^my (.+?) name is (.+)/i,
    /^my (.+?) is (.+)/i,
  ];

  for (const pattern of relationNamePatterns) {
    const match = cleanText.match(pattern);

    if (match?.[1] && match?.[2]) {
      const relation = normalizeRelation(match[1]);

      if (isPersonRelation(relation)) {
        return `${formatRelation(relation)}'s name: ${capitalizeName(
          match[2]
        )}`;
      }
    }
  }

  const reverseRelationPattern = cleanText.match(
    /^(.+) is my (.+)/i
  );

  if (
    reverseRelationPattern?.[1] &&
    reverseRelationPattern?.[2]
  ) {
    const relation = normalizeRelation(reverseRelationPattern[2]);

    if (isPersonRelation(relation)) {
      return `${formatRelation(relation)}'s name: ${capitalizeName(
        reverseRelationPattern[1]
      )}`;
    }
  }

  const metNamedPersonPattern = cleanText.match(
    /^i met (?:a|an) (.+?) named (.+?)(?: at | in | near | from | during )(.+)/i
  );

  if (
    metNamedPersonPattern?.[1] &&
    metNamedPersonPattern?.[2] &&
    metNamedPersonPattern?.[3]
  ) {
    const relation = normalizeRelation(metNamedPersonPattern[1]);

    if (isPersonRelation(relation)) {
      return `Met ${formatRelation(relation)}: ${capitalizeName(
        metNamedPersonPattern[2]
      )} at ${capitalizeValue(metNamedPersonPattern[3])}`;
    }
  }

  const metPersonPattern = cleanText.match(
    /^i met (.+?)(?: at | in | near | from | during )(.+)/i
  );

  if (metPersonPattern?.[1] && metPersonPattern?.[2]) {
    return `Met Person: ${capitalizeName(
      metPersonPattern[1]
    )} at ${capitalizeValue(metPersonPattern[2])}`;
  }

  const favoritePattern = cleanText.match(
  /my favorite (.+?) is (.+)/i
);

if (favoritePattern) {
  const favoriteType = String(favoritePattern[1]);
  const favoriteValue = String(favoritePattern[2]);

  if (favoriteType && favoriteValue) {
    return `Favorite ${favoriteType.toLowerCase()}: ${capitalizeValue(
      favoriteValue
    )}`;
  }
}

  const birthdayPattern = cleanText.match(
  /my birthday is (.+)/i
);

if (birthdayPattern?.[1]) {
  return `Birthday: ${capitalizeValue(birthdayPattern[1])}`;
}

const likePattern = cleanText.match(/^i like (.+)/i);

if (likePattern?.[1]) {
  return `Likes: ${capitalizeValue(likePattern[1])}`;
}

const lovePattern = cleanText.match(/^i love (.+)/i);

if (lovePattern?.[1]) {
  return `Loves: ${capitalizeValue(lovePattern[1])}`;
}

const hatePattern = cleanText.match(/^i hate (.+)/i);

if (hatePattern?.[1]) {
  return `Dislikes: ${capitalizeValue(hatePattern[1])}`;
}

const havePattern = cleanText.match(/^i have (.+)/i);

if (havePattern?.[1]) {
  return `Has: ${capitalizeValue(havePattern[1])}`;
}

const iamPattern = cleanText.match(/^i am (.+)/i);

if (iamPattern?.[1]) {
  return `User is: ${capitalizeValue(iamPattern[1])}`;
}

const imPattern = cleanText.match(/^i'm (.+)/i);

if (imPattern?.[1]) {
  return `User is: ${capitalizeValue(imPattern[1])}`;
}

const rememberPattern = cleanText.match(
  /remember that (.+)/i
);

if (rememberPattern?.[1]) {
  return `Remember: ${capitalizeValue(rememberPattern[1])}`;
}

return null;
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
  return extractMemoryFact(text) !== null;
}

export function addMemory(text: string) {
  const memories = loadMemories();
  const cleanText = extractMemoryFact(text);

  if (!cleanText) {
    return null;
  }

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