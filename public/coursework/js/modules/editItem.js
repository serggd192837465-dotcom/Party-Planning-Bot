export function editItem(list, id, updates) {
  return list.map((item) => {
    if (item.id !== id) return item;
    return { ...item, ...updates };
  });
}