/**
 * Chart Utilities for Dynamic Color Generation and Chart Configuration
 */

/**
 * Generates a distinct color for a given index using HSL color space
 * This ensures colors are visually distinct even with many items
 */
export const generateColor = (index: number, total: number, saturation = 70, lightness = 50): string => {
  const hue = (index * 360) / Math.max(total, 1);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Generates an array of distinct colors
 */
export const generateColorArray = (count: number, saturation = 70, lightness = 50): string[] => {
  return Array.from({ length: count }, (_, i) => generateColor(i, count, saturation, lightness));
};

/**
 * Pre-defined color palette for consistent theming
 * Falls back to dynamic generation if more colors are needed
 */
export const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#F43F5E', // Rose
  '#8B5CF6', // Violet
  '#0EA5E9', // Sky
  '#22C55E', // Emerald
];

/**
 * Get a color by index, extending the palette dynamically if needed
 */
export const getColorByIndex = (index: number, total?: number): string => {
  if (index < COLOR_PALETTE.length) {
    return COLOR_PALETTE[index];
  }
  return generateColor(index, total || index + 1);
};

/**
 * Get an array of colors for a specific count
 */
export const getColorsForCount = (count: number): string[] => {
  if (count <= COLOR_PALETTE.length) {
    return COLOR_PALETTE.slice(0, count);
  }
  return generateColorArray(count);
};

/**
 * Enhanced toolbar configuration with zoom controls
 */
export const getToolbarConfig = (includeZoom = true) => ({
  show: true,
  tools: {
    download: true,
    selection: includeZoom,
    zoom: includeZoom,
    zoomin: includeZoom,
    zoomout: includeZoom,
    pan: includeZoom,
    reset: includeZoom ? 'reset zoom' : false
  },
  autoSelected: includeZoom ? 'zoom' : 'none'
});

