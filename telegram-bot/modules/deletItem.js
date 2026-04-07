export function deletItem(items, id) {
  return items.filter((item) => item.id !== id);
}