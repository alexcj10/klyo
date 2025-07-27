// Predefined color palette for events
export const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F97316', // Orange
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange (variant)
];

// Function to get the next color from the palette based on existing events count
export const getNextColor = (existingEvents: Array<{ color: string }>): string => {
  // Use the total number of existing events to determine the next color index
  const eventCount = existingEvents.length;
  const colorIndex = eventCount % COLOR_PALETTE.length;
  return COLOR_PALETTE[colorIndex];
};

// Function to get color name for display purposes
export const getColorName = (color: string): string => {
  const colorMap: Record<string, string> = {
    '#3B82F6': 'Blue',
    '#10B981': 'Emerald',
    '#F97316': 'Orange',
    '#EF4444': 'Red',
    '#8B5CF6': 'Purple',
    '#F59E0B': 'Amber',
    '#06B6D4': 'Cyan',
    '#84CC16': 'Lime',
    '#EC4899': 'Pink',
    '#6366F1': 'Indigo',
    '#14B8A6': 'Teal',
  };
  return colorMap[color] || 'Custom';
};

// Function to get the next available color index
export const getNextColorIndex = (existingEvents: Array<{ color: string }>): number => {
  return existingEvents.length % COLOR_PALETTE.length;
};