/**
 * Format an ISO datetime string to a short locale date.
 * @param {string} iso - ISO datetime string
 * @returns {string} Formatted date
 */
export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Capitalize first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Return a color class based on a 0-100 score.
 * @param {number} score
 * @returns {string} Tailwind text color class
 */
export function scoreColor(score) {
  if (score >= 75) return "text-green_custom";
  if (score >= 50) return "text-amber_custom";
  return "text-red_custom";
}

/**
 * Return a background color class based on a 0-100 score.
 * @param {number} score
 * @returns {string} Tailwind bg+text classes
 */
export function scoreBgClass(score) {
  if (score >= 75) return "bg-green-50 text-green_custom";
  if (score >= 50) return "bg-amber-50 text-amber_custom";
  return "bg-red-50 text-red_custom";
}

/**
 * Sector display labels.
 */
export const SECTOR_LABELS = {
  transport: "Transport",
  agroalim: "Agroalimentaire",
  it: "IT / Tech",
  hospitality: "Hôtellerie",
  btp: "BTP",
  maintenance: "Maintenance",
};

/**
 * Return a human-readable sector label.
 * @param {string} sector - Sector key
 * @returns {string} Display label
 */
export function formatSector(sector) {
  return SECTOR_LABELS[sector] || sector;
}

/**
 * Status display config.
 */
export const STATUS_CONFIG = {
  open: { label: "Ouvert", className: "bg-green-100 text-green_custom" },
  closed: { label: "Fermé", className: "bg-gray-100 text-gray-600" },
  matched: { label: "Matché", className: "bg-blue-100 text-accent" },
};
