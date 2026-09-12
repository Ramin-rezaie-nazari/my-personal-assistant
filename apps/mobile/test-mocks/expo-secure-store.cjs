const store = new Map();
module.exports = {
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  getItemAsync: async (key) => store.get(key) ?? null,
  setItemAsync: async (key, value) => { store.set(key, value); },
  deleteItemAsync: async (key) => { store.delete(key); },
};
