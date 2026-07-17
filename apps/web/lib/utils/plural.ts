/** "1 response", "3 responses" — count + correctly pluralized noun. */
export function plural(count: number, noun: string, pluralForm?: string): string {
  const word = count === 1 ? noun : (pluralForm ?? `${noun}s`);
  return `${count} ${word}`;
}
