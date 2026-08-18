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

// Each role logs in under its own localStorage key (vendorCurrentUser,
// riderCurrentUser, customerCurrentUser) so a person can be signed in as
// more than one role at once without one login overwriting another.
export const CURRENT_USER_KEYS = {
  vendor: "vendorCurrentUser",
  rider: "riderCurrentUser",
  customer: "customerCurrentUser",
};

// Role-agnostic pages (Account, the cart) don't know in advance which role
// is browsing them, so they check every role's key and return whichever
// one is actually signed in.
export function getCurrentUser() {
  for (const key of Object.values(CURRENT_USER_KEYS)) {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    if (value) return value;
  }
  return null;
}
