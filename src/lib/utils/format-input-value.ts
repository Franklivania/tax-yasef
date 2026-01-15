export const formatInputValue = (value: string): string => {
  // Remove all non-digit characters except decimal point
  const numericValue = value.replace(/[^\d.]/g, "");

  // If empty, return empty string
  if (!numericValue) return "";

  // Split by decimal point if present
  const parts = numericValue.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Format integer part with commas
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Combine with decimal part if present
  return decimalPart !== undefined
    ? `${formattedInteger}.${decimalPart}`
    : formattedInteger;
};
