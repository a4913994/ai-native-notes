export function readingPosition(top: number, height: number, viewportHeight: number, offset: number, headings: number[]) {
  const distance = height - Math.max(0, viewportHeight - offset);
  const progress = distance <= 0 ? (top + height <= viewportHeight ? 100 : 0)
    : Math.round(Math.max(0, Math.min(1, (offset - top) / distance)) * 100);
  let active = -1;
  headings.forEach((position, index) => { if (position <= offset + 16) active = index; });
  if (progress === 100 && headings.length) active = headings.length - 1;
  return {progress, active};
}
