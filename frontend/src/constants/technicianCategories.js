/** Must match backend `TechnicianCategory` enum names. */
export const TECHNICIAN_CATEGORIES = [
  { value: "ELECTRICAL", label: "Electrical", emoji: "⚡" },
  { value: "PLUMBING", label: "Plumbing", emoji: "💧" },
  { value: "EQUIPMENT", label: "Equipment", emoji: "🔧" },
  { value: "IT_NETWORK", label: "IT/Network", emoji: "💻" },
  { value: "CLEANING", label: "Cleaning", emoji: "🧹" },
  { value: "OTHER", label: "Other", emoji: "❓" },
];

export function technicianCategoryLabel(value) {
  if (!value) return null;
  const row = TECHNICIAN_CATEGORIES.find((c) => c.value === value);
  return row ? `${row.emoji} ${row.label}` : value;
}
