export function editItem(items, id, updates) {
  return items.map((item) => (item.id === id ? { ...item, ...updates } : item));
}