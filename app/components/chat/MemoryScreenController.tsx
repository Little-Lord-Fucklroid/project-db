import type { Dispatch, SetStateAction } from "react";
import MemoryScreen from "../screens/MemoryScreen";

import { saveMessages } from "@/lib/chatStorage";

import {
  clearMemories,
  deleteMemory,
  type Memory,
} from "@/lib/memory";

import {
  clearCloudMemories,
  clearCloudMessages,
  deleteCloudMemory,
} from "@/lib/supabaseStorage";

import type { ChatMessage } from "@/lib/chatTypes";

type MemoryScreenControllerProps = {
  memories: Memory[];
  setMemories: Dispatch<SetStateAction<Memory[]>>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  currentUserId: string | null;
  incognito: boolean;
  conversationId: string | null;
  onBack: () => void;
};

export default function MemoryScreenController({
  memories,
  setMemories,
  setMessages,
  currentUserId,
  incognito,
  conversationId,
  onBack,
}: MemoryScreenControllerProps) {
  return (
    <MemoryScreen
      memories={memories}
      onBack={onBack}
      onDelete={async (id) => {
        if (currentUserId && !incognito) {
          await deleteCloudMemory(id);

          setMemories((prev) =>
            prev.filter((memory) => memory.id !== id)
          );
        } else {
          const result = deleteMemory(id);

          setMemories(result.updatedMemories);
        }

        const shouldClearChat = confirm(
          "Memory deleted. This fact may still appear in your chat history. Clear chat history too?"
        );

        if (shouldClearChat) {
          setMessages([]);

          if (
            currentUserId &&
            !incognito &&
            conversationId
          ) {
            await clearCloudMessages(conversationId);
          } else {
            saveMessages([]);
          }
        }
      }}
      onClearMemories={async () => {
        setMemories([]);

        if (currentUserId && !incognito) {
          await clearCloudMemories();
        } else {
          clearMemories();
        }
      }}
      onClearChatHistory={async () => {
        setMessages([]);

        if (
          currentUserId &&
          !incognito &&
          conversationId
        ) {
          await clearCloudMessages(conversationId);
        } else {
          saveMessages([]);
        }
      }}
    />
  );
}