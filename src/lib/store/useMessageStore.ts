import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModelID } from "../types/models";

export type MessageRole = "user" | "assistant";

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  model?: ModelID;
};

type MessageStore = {
  messages: Message[];
  isLoading: boolean;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  clearMessages: () => void;
  getMessages: () => Message[];
  getLatestMessage: () => Message | undefined;
  setLoading: (loading: boolean) => void;
};

export const useMessageStore = create<MessageStore>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,

      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now(),
        };
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      },

      clearMessages: () => {
        set({ messages: [], isLoading: false });
      },

      getMessages: () => {
        return get().messages;
      },

      getLatestMessage: () => {
        const messages = get().messages;
        return messages.length > 0 ? messages[messages.length - 1] : undefined;
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: "tax-yasef-messages-storage",
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
