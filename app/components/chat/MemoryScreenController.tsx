import type { Dispatch, SetStateAction } from "react";
import { useState } from "react"; // <-- FIX: added import
import MemoryScreen from "../screens/MemoryScreen";
import ConfirmModal from "../ConfirmModal";

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
  // --- Modal state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // --- Delete a single memory ---
  function handleDeleteMemory(id: string) {
    setModalConfig({
      title: "Delete Memory?",
      message: "This memory will be removed from your saved list.",
      onConfirm: async () => {
        setModalOpen(false);
        if (currentUserId && !incognito) {
          await deleteCloudMemory(id);
          setMemories((prev) =>
            prev.filter((memory) => memory.id !== id)
          );
        } else {
          const result = deleteMemory(id);
          setMemories(result.updatedMemories);
        }

        // Optional: also clear chat history
        const shouldClearChat = confirm(
          "Memory deleted. This fact may still appear in your chat history. Clear chat history too?"
        );
        if (shouldClearChat) {
          setMessages([]);
          if (currentUserId && !incognito && conversationId) {
            await clearCloudMessages(conversationId);
          } else {
            saveMessages([]);
          }
        }
      },
    });
    setModalOpen(true);
  }

  // --- Clear all memories ---
  function handleClearMemories() {
    setModalConfig({
      title: "Clear All Memories?",
      message: "All saved memories will be permanently removed. This cannot be undone.",
      onConfirm: async () => {
        setModalOpen(false);
        setMemories([]);
        if (currentUserId && !incognito) {
          await clearCloudMemories();
        } else {
          clearMemories();
        }
      },
    });
    setModalOpen(true);
  }

  // --- Clear chat history ---
  function handleClearChatHistory() {
    setModalConfig({
      title: "Clear Chat History?",
      message: "All messages in this conversation will be removed. This cannot be undone.",
      onConfirm: async () => {
        setModalOpen(false);
        setMessages([]);
        if (currentUserId && !incognito && conversationId) {
          await clearCloudMessages(conversationId);
        } else {
          saveMessages([]);
        }
      },
    });
    setModalOpen(true);
  }

  return (
    <>
      <MemoryScreen
        memories={memories}
        onBack={onBack}
        onDelete={handleDeleteMemory}
        onClearMemories={handleClearMemories}
        onClearChatHistory={handleClearChatHistory}
      />

      {/* Custom confirmation modal */}
      {modalOpen && (
        <ConfirmModal
          title={modalConfig.title}
          message={modalConfig.message}
          confirmLabel="Yes, delete"
          cancelLabel="Cancel"
          onConfirm={() => {
            modalConfig.onConfirm();
          }}
          onCancel={() => setModalOpen(false)}
        />
      )}
    </>
  );
}