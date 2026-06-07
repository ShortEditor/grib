import { create } from 'zustand';
import api from '../api/client';

export const useChatStore = create((set, get) => ({
  messages: [],
  loading: false,
  historyLoaded: false,

  loadHistory: async () => {
    try {
      const { data } = await api.get('/chat/history');
      set({ messages: data.messages, historyLoaded: true });
    } catch (err) {
      console.error('Load chat history failed:', err);
      set({ historyLoaded: true });
    }
  },

  sendMessage: async (content) => {
    // Add user message optimistically
    const userMsg = {
      _id: `u-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, userMsg], loading: true }));

    try {
      const { data } = await api.post('/chat', { message: content });
      set((state) => ({
        messages: [...state.messages, data.message],
        loading: false,
      }));
    } catch (err) {
      const errorMsg = {
        _id: `err-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ ' + (err.response?.data?.error || 'Something went wrong. Try again.'),
        createdAt: new Date().toISOString(),
        isError: true,
      };
      set((state) => ({ messages: [...state.messages, errorMsg], loading: false }));
    }
  },

  clearHistory: async () => {
    try {
      await api.delete('/chat/history');
      set({ messages: [] });
    } catch (err) {
      console.error('Clear chat history failed:', err);
    }
  },

  rateFeedback: async (messageId, rating) => {
    try {
      await api.post('/feedback', { messageId, rating });
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId ? { ...m, feedback: rating } : m
        ),
      }));
    } catch (err) {
      console.error('Feedback failed:', err);
    }
  },
}));
