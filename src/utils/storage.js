// Reads a JSON array out of localStorage safely. If the key is missing, or
// the saved value isn't valid JSON, or it's not actually an array, this
// just returns an empty array instead of throwing an error.
export function getStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
