// A safer replacement for `Date.now()` as a primary key generator.
//
// Date.now() alone can collide if two records are created in the same
// millisecond (e.g. two customers placing an order at the same instant
// on two different devices). This keeps IDs sortable-by-time (still
// starts with the timestamp) but appends a random suffix so collisions
// are effectively impossible.
//
// Use this anywhere you currently write `id: Date.now()`.
export function generateId() {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${randomSuffix}`;
}