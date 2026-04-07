function toComparableValue(value) {
  const asDate = Date.parse(value);
  if (!Number.isNaN(asDate)) {
    return asDate;
  }

  return String(value).toLowerCase();
}

export function sortItems(items, field) {
  return [...items].sort((a, b) => {
    const aValue = toComparableValue(a[field]);
    const bValue = toComparableValue(b[field]);

    if (aValue > bValue) return 1;
    if (aValue < bValue) return -1;
    return 0;
  });
}