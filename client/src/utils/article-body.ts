/** Hide an exact duplicate opening title in the reading view; stored Markdown stays intact. */
export function articleBody(content: string, title: string): string {
  const heading = /^(?:[\t ]*\r?\n)*#{1}[\t ]+([^\r\n]+)(?:\r?\n|$)/.exec(content);
  if (!heading || heading[1].replace(/[\t ]+#+[\t ]*$/, '').trim() !== title.trim()) return content;
  return content.slice(heading[0].length).replace(/^(?:[\t ]*\r?\n)+/, '');
}
