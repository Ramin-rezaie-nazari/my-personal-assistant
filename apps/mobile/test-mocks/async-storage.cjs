const store = new Map();
module.exports = {
  getItem: async (key) => store.get(key) ?? null,
  setItem: async (key, value) => { store.set(key, value); },
  removeItem: async (key) => { store.delete(key); },
  clear: async () => { store.clear(); },
  multiGet: async (keys) => keys.map((key) => [key, store.get(key) ?? null]),
  multiSet: async (entries) => { for (const [key, value] of entries) store.set(key, value); },
  multiRemove: async (keys) => { for (const key of keys) store.delete(key); },
};
