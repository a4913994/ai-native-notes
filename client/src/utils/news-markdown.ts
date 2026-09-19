/** Presentation-only cleanup; the original generated Markdown stays in D1. */
export function prepareNewsMarkdown(content: string): string {
  return content.replace(/^# [^\n]+\n+/, '')
    // Enrichment sometimes leaks internal search IDs instead of real citations.
    // Keep the actual source hyperlinks and reference lists intact.
    .replace(/[（(]\s*tool-\d+-\d+(?:[、,，\s]+tool-\d+-\d+)*\s*[）)]/g, '')
    .replace(/\\?\[tool-\d+-\d+\\?\](?!\()/g, '')
    .replace(/&\\#(?:x27|39);/gi, "'");
}
