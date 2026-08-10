export function getTelegramGroupLink(fastGroupUsername?: string): string {
  if (!fastGroupUsername) return 'https://t.me/+ec-4Jk1PY7w3Y2Vl';
  if (fastGroupUsername.startsWith('http://') || fastGroupUsername.startsWith('https://')) {
    return fastGroupUsername;
  }
  const clean = fastGroupUsername.replace(/^@/, '');
  if (clean.startsWith('+')) {
    return `https://t.me/${clean}`;
  }
  return `https://t.me/${clean}`;
}

export function getTelegramGroupDisplay(fastGroupUsername?: string): string {
  if (!fastGroupUsername) return 'VYRNXY ADS Official Group';
  if (fastGroupUsername.includes('+ec-4Jk1PY7w3Y2Vl') || fastGroupUsername.startsWith('http')) {
    return 'VYRNXY ADS Official Group';
  }
  return fastGroupUsername.startsWith('@') ? fastGroupUsername : `@${fastGroupUsername}`;
}
