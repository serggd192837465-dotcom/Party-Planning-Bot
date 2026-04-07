export function deleteItem(list, id) {
  return list.filter((item) => item.id !== id);
}