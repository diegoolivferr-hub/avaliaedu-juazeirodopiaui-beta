import { useMemo } from "react";
import { renderTextWithMathToHTML } from "@/lib/math-utils";

interface MathTextProps {
  /** The text to render, which may contain $ ... $ inline math. */
  text: string;
  /** Extra class names for the wrapper span. */
  className?: string;
  /** Extra inline styles for the wrapper span. */
  style?: React.CSSProperties;
  /** If true, wraps content in a <p> element instead of <span>. */
  block?: boolean;
}

/**
 * Renders a text string that may contain inline LaTeX formulas delimited
 * by single dollar signs ($ ... $). Non-math portions are rendered as
 * plain escaped text; math portions are rendered by KaTeX.
 *
 * @example
 *   <MathText text="Calcule: $ \sqrt{16} $" />
 */
export function MathText({ text, className, style, block = false }: MathTextProps) {
  const html = useMemo(() => renderTextWithMathToHTML(text ?? ""), [text]);

  if (block) {
    return (
      <p
        className={className}
        style={style}
        // KaTeX output is trusted HTML — it never originates from user-controlled
        // raw HTML, only from the KaTeX renderer itself.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
