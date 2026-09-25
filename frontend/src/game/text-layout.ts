import type { Rectangle } from "../detection/types";

// Carrie Micro is a monospaced pixel font: 9 font pixels per em, 6 pixel
// advance per glyph (5 of ink plus 1 of spacing) and 6 pixel capitals.
export const FONT_PIXELS_PER_EM = 9;
const GLYPH_ADVANCE_PIXELS = 6;
const CAP_HEIGHT_PIXELS = 6;
const LINE_GAP_PIXELS = 4;

export interface Point {
  x: number;
  y: number;
}

export interface TextLine {
  text: string;
  x: number;
  baselineY: number;
}

export interface TextBlock {
  fontSize: number;
  lines: TextLine[];
}

export function fitPixelSize(
  lines: readonly string[],
  box: Pick<Rectangle, "width" | "height">,
  maxPixelSize: number,
): number {
  const size = textSizeInFontPixels(lines);
  const fittingPixelSize = Math.floor(
    Math.min(box.width / size.width, box.height / size.height),
  );
  return Math.max(1, Math.min(fittingPixelSize, maxPixelSize));
}

export function layoutText(
  lines: readonly string[],
  centre: Point,
  pixelSize: number,
): TextBlock {
  const blockHeight = textSizeInFontPixels(lines).height * pixelSize;
  const top = centre.y - blockHeight / 2;

  return {
    fontSize: FONT_PIXELS_PER_EM * pixelSize,
    lines: lines.map((text, index) => ({
      text,
      x: Math.round(centre.x - (inkWidthInFontPixels(text) * pixelSize) / 2),
      baselineY: Math.round(
        top +
          (index * (CAP_HEIGHT_PIXELS + LINE_GAP_PIXELS) + CAP_HEIGHT_PIXELS) *
            pixelSize,
      ),
    })),
  };
}

function textSizeInFontPixels(lines: readonly string[]): {
  width: number;
  height: number;
} {
  return {
    width: Math.max(1, ...lines.map(inkWidthInFontPixels)),
    height:
      lines.length * CAP_HEIGHT_PIXELS +
      Math.max(0, lines.length - 1) * LINE_GAP_PIXELS,
  };
}

function inkWidthInFontPixels(text: string): number {
  return Math.max(0, text.length * GLYPH_ADVANCE_PIXELS - 1);
}
