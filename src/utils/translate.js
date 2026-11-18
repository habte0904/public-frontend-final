export const translateField = (obj, lang, field) => {
  if (!obj) return "";
  if (lang === "am") {
    // Use field_am if it exists, otherwise fallback to field
    return obj[`${field}_am`] ?? obj[field] ?? "";
  }
  return obj[field] ?? "";
};
