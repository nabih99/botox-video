/** Editable settings for all three NN Aesthetics pause-challenge exports. */
export const PAUSE_SALE = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 360,
  price: 900,
  currency: '₪',
  // Primary BotoxSale composition. Alternates remain separately selectable.
  mainVariant: 'syringe' as ChallengeVariant,
  colors: {
    ivory: '#F7F3ED',
    beige: '#DED0BE',
    gold: '#C6A77B',
    black: '#171717',
  },
  text: {
    headline: 'רק 1% מצליחים לעצור בזמן הנכון',
    support: 'נראה אתכם מצליחים 👀',
    syringeInstruction: 'עצרו בדיוק כשהמזרק נכנס למסגרת',
    vialInstruction: 'עצרו בדיוק כשהבקבוקון נכנס למסגרת',
    offerPrefix: 'בוטוקס ב־',
    offerSuffix: ' בלבד',
    screenshot: 'צלמו מסך ושלחו לנו בפרטי',
    brand: 'NN AESTHETICS',
    retry: 'נסו שוב אם פספסתם',
  },
  timeline: {
    challengeStart: 60,
    challengeEnd: 270, // Exclusive: the final challenge frame is 269.
    winningStarts: [98, 163, 228],
    winningFrames: 6,
    // 1 = six frames. Raise to 1.5 for four-frame catches; lower to ease it.
    difficulty: 1,
  },
  motion: {
    distance: 820,
    speed: 1,
    slowSpeedMultiplier: 0.76,
    maximumRotation: 3.5,
    verticalDrift: 12,
  },
} as const;

/** A single text node lets the browser apply Hebrew bidi shaping correctly. */
export const getOfferText = (): string =>
  `${PAUSE_SALE.text.offerPrefix}${PAUSE_SALE.price}${PAUSE_SALE.currency}${PAUSE_SALE.text.offerSuffix}`;

export type ChallengeVariant = 'syringe' | 'slow' | 'vial';
