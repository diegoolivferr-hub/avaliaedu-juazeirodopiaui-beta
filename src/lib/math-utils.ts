import katex from "katex";

/**
 * Splits a text string into an array of segments, where each segment is either
 * plain text or a LaTeX formula to be rendered by KaTeX.
 *
 * Formulas are delimited by single dollar signs: $ ... $
 * Example: "Calcule: $ \sqrt{16} $" → 3 segments: text, formula, (empty)
 */
export interface TextSegment {
  type: "text" | "math";
  content: string;
}

export function parseTextWithMath(text: string): TextSegment[] {
  if (!text) return [];

  const segments: TextSegment[] = [];
  // Match $...$ — non-greedy, allowing spaces inside
  const mathRegex = /\$([^$]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(text)) !== null) {
    // Text before this formula
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    // The formula itself (trim surrounding spaces)
    segments.push({ type: "math", content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last formula
  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments;
}

/**
 * Renders a LaTeX string to an HTML string using KaTeX.
 * Returns the raw text on error to avoid breaking the UI.
 */
export function renderMathToHTML(latex: string): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: false,
      output: "html",
    });
  } catch {
    return latex;
  }
}

/**
 * Converts a text string (possibly containing $ ... $ formulas) to an HTML
 * string safe for `dangerouslySetInnerHTML`. Plain-text portions are escaped.
 */
export function renderTextWithMathToHTML(text: string): string {
  if (!text) return "";
  const segments = parseTextWithMath(text);
  return segments
    .map((seg) => {
      if (seg.type === "math") {
        return renderMathToHTML(seg.content);
      }
      // Escape HTML in plain-text segments
      return seg.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    })
    .join("");
}
