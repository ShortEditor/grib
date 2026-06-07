import { create } from 'zustand';
import api from '../api/client';

export const useDumpsStore = create((set, get) => ({
  dumps: [],
  pagination: { page: 1, total: 0, pages: 1 },
  loading: false,
  searchResults: null,
  searchQuery: '',
  isSearching: false,
  relatedMap: {}, // dumpId -> related dumps array

  fetchDumps: async (page = 1, append = false) => {
    set({ loading: true });
    try {
      const { data } = await api.get(`/dumps?page=${page}&limit=20`);
      set((state) => ({
        dumps: append ? [...state.dumps, ...data.dumps] : data.dumps,
        pagination: data.pagination,
        loading: false,
      }));
    } catch (err) {
      console.error('Fetch dumps failed:', err);
      set({ loading: false });
    }
  },

  addDump: async (content) => {
    // Optimistic UI — add a placeholder immediately
    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic = {
      _id: optimisticId,
      content,
      moodTag: 'random',
      wordCount: content.trim().split(/\s+/).filter(Boolean).length,
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    set((state) => ({ dumps: [optimistic, ...state.dumps] }));

    try {
      const { data } = await api.post('/dumps', { content });
      // data has { ...dump, related: [...] }
      const { related = [], ...dumpData } = data;
      // Replace optimistic with real data
      set((state) => ({
        dumps: state.dumps.map((d) => (d._id === optimisticId ? dumpData : d)),
        relatedMap: related.length > 0
          ? { ...state.relatedMap, [dumpData._id]: related }
          : state.relatedMap,
      }));

      // After a short delay, fetch the real dump with mood tag (Groq is async)
      setTimeout(async () => {
        try {
          const { data: updated } = await api.get(`/dumps?page=1&limit=1`);
          if (updated.dumps[0]?._id === data._id) {
            set((state) => ({
              dumps: state.dumps.map((d) =>
                d._id === data._id ? updated.dumps[0] : d
              ),
            }));
          }
        } catch (e) {
          // Mood tag refresh is best-effort
        }
      }, 3000);

      return { success: true, dump: data };
    } catch (err) {
      // Remove optimistic on failure
      set((state) => ({ dumps: state.dumps.filter((d) => d._id !== optimisticId) }));
      return { success: false, error: err.response?.data?.error || 'Failed to save dump' };
    }
  },

  deleteDump: async (id) => {
    // Optimistic remove
    set((state) => ({ dumps: state.dumps.filter((d) => d._id !== id) }));
    try {
      await api.delete(`/dumps/${id}`);
    } catch (err) {
      // Restore on failure — refetch
      get().fetchDumps();
    }
  },

  search: async (query, filters = {}) => {
    if (!query.trim()) {
      set({ searchResults: null, searchQuery: '', isSearching: false });
      return;
    }
    set({ isSearching: true, searchQuery: query });
    try {
      const params = new URLSearchParams({ q: query, ...filters });
      const { data } = await api.get(`/dumps/search?${params}`);
      set({ searchResults: data.dumps, isSearching: false });
    } catch (err) {
      console.error('Search failed:', err);
      set({ isSearching: false });
    }
  },

  clearSearch: () => set({ searchResults: null, searchQuery: '', isSearching: false }),
}));
