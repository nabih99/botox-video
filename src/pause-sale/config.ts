/** Editable settings for the continuously moving six-second pause challenge. */
export const PAUSE_SALE = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 180,
  price: 900,
  currency: '₪',
  // Primary BotoxSale composition. Alternates remain separately selectable.
  mainVariant: 'vial' as ChallengeVariant,
  colors: {
    ivory: '#101C20',
    beige: '#253A40',
    gold: '#C6A77B',
    black: '#F5F0E8',
  },
  text: {
    headline: 'רק 1% מצליחים לעצור בזמן הנכון',
    support: 'נראה אתכם מצליחים 👀',
    syringeInstruction: 'עצרו בדיוק כשהמזרק נכנס למסגרת',
    vialInstruction: 'עצרו בדיוק כשהבקבוקון נכנס למסגרת',
    offerPrefix: 'בוטוקס ב־',
    offerSuffix: ' בלבד',
    screenshot: 'צלמו מסך ושלחו לנו בפרטי',
    brand: '',
    retry: '',
  },
  timeline: {
    challengeStart: 0,
    challengeEnd: 180, // Exclusive: the immediate challenge runs for the whole video.
    winningStarts: [8, 68, 128],
    winningFrames: 6, // Offer duration only; the product never holds still.
    // 1 = six frames. Raise to 1.5 for four-frame catches; lower to ease it.
    difficulty: 1,
  },
  motion: {
    distance: 850,
    // At least 720 composition pixels keeps product wrapping out of view.
    minimumDistance: 720,
    // Changes constant travel velocity while preserving the periodic catch times.
    speed: 1,
    slowSpeedMultiplier: 0.82,
    maximumRotation: 0,
    verticalDrift: 0,
  },
} as const;

/** A single text node lets the browser apply Hebrew bidi shaping correctly. */
export const getOfferText = (): string =>
  `${PAUSE_SALE.text.offerPrefix}${PAUSE_SALE.price}${PAUSE_SALE.currency}${PAUSE_SALE.text.offerSuffix}`;

export type ChallengeVariant = 'syringe' | 'slow' | 'vial';
