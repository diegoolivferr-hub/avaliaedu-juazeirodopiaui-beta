/**
 * Lightweight helpers used to migrate any legacy HTML statements (created by
 * the old TipTap editor) into plain text for the new structured form.
 */

export function isHtml(value: string | null | undefined): boolean {
  if (!value) return false;
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function htmlToPlainText(html: string): string {
  if (!html) return "";
  if (typeof document === "undefined") {
    // SSR fallback: strip tags textually.
    return html
      .replace(/<\s*br\s*\/?\s*>/gi, "\n")
      .replace(/<\/p\s*>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
  }
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  // Convert <br> and block boundaries into newlines.
  tmp.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  tmp
    .querySelectorAll("p,div,li")
    .forEach((el) => el.append("\n"));
  return (tmp.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}
