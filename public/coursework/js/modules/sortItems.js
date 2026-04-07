export function sortItems(list, field) {
  const sorted = [...list];

  sorted.sort((a, b) => {
    const valueA = a[field] ?? "";
    const valueB = b[field] ?? "";

    if (typeof valueA === "number" && typeof valueB === "number") {
      return valueA - valueB;
    }

    return String(valueA).localeCompare(String(valueB));
  });

  return sorted;
}