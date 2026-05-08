export const CRISIS_KEYWORDS = [
  'want to die',
  'kill myself',
  'end my life',
  'suicide',
  "can't go on",
  'cant go on',
  'hurt myself',
  'self harm',
  'self-harm',
  'no reason to live',
];

export function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

export const CRISIS_HELPLINES = [
  { name: 'iCall', phone: '9152987821', hours: 'Mon-Sat 8am-10pm' },
  { name: 'Vandrevala Foundation', phone: '1860-2662-345', hours: '24/7' },
  { name: 'AASRA', phone: '9820466726', hours: '24/7' },
];
