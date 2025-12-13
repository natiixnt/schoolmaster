// Polish profanity filter with common swear words
const POLISH_PROFANITY = [
  // Common Polish swear words
  'kurwa', 'kurwy', 'kurwą', 'kurwe', 'kurwę', 'kurwo',
  'pierdol', 'pierdolić', 'pierdole', 'pierdolę', 'pierdoli', 'pierdolisz',
  'jebać', 'jebac', 'jebane', 'jebany', 'jebana', 'jebie', 'jebiesz',
  'chuj', 'chuja', 'chujem', 'chujek', 'chujowy', 'chujowa',
  'suka', 'suki', 'suką', 'sukę', 'suko',
  'dupa', 'dupy', 'dupą', 'dupę', 'dupo', 'dupek',
  'gówno', 'gowno', 'gówna', 'gowna', 'gównem', 'gownem',
  'pierdolenie', 'pierdolenia', 'pierdoleniu',
  'zjeb', 'zjeba', 'zjebany', 'zjebana', 'zjebane',
  'debil', 'debilu', 'debilem', 'debile', 'debilka',
  'idiota', 'idiotka', 'idioto', 'idioci',
  'spierdalaj', 'spierdala', 'spierdalać',
  'jebany', 'jebana', 'jebane',
  'kutас', 'kutas', 'kutasa', 'kutasie',
  'dziwka', 'dziwki', 'dziwką', 'dziwkę',
  'skurwysyn', 'skurwysynu', 'skurwysyny',
  'pizda', 'pizdy', 'pizdą', 'pizdę',
  // English swear words that might be used
  'fuck', 'fucking', 'fucked', 'fucker',
  'shit', 'shitting', 'shitty',
  'bitch', 'bitches', 'bitching',
  'damn', 'damned', 'dammit',
  'ass', 'asshole', 'asses',
  'bastard', 'bastards',
  'crap', 'crappy', 'crapping'
];

/**
 * Filters profanity from text by replacing swear words with asterisks
 * @param text - The text to filter
 * @returns Filtered text with profanity replaced by asterisks
 */
export function filterProfanity(text: string): string {
  if (!text) return text;

  let filteredText = text;

  // Create regex patterns for each profanity word (case-insensitive)
  POLISH_PROFANITY.forEach(word => {
    // Create pattern that matches the word with word boundaries
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    
    // Replace with asterisks of the same length
    filteredText = filteredText.replace(pattern, (match) => {
      return '*'.repeat(match.length);
    });
  });

  // Also handle partial censoring for very long words
  filteredText = filteredText.replace(/(\w*)(kurw|pierdol|jeb|chuj)(\w*)/gi, (match, prefix, middle, suffix) => {
    if (match.length <= 3) return match; // Don't censor very short matches
    return prefix + '*'.repeat(middle.length) + suffix;
  });

  return filteredText;
}

/**
 * Checks if text contains profanity
 * @param text - The text to check
 * @returns True if profanity is found, false otherwise
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;

  return POLISH_PROFANITY.some(word => {
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return pattern.test(text);
  });
}

/**
 * Get severity level of profanity in text
 * @param text - The text to analyze
 * @returns Number from 0-3 indicating severity (0 = no profanity, 3 = severe)
 */
export function getProfanitySeverity(text: string): number {
  if (!text) return 0;

  const severeProfanity = ['kurwa', 'jebać', 'pierdolić', 'chuj', 'fuck'];
  const moderateProfanity = ['dupa', 'gówno', 'suka', 'shit', 'damn'];
  const mildProfanity = ['idiota', 'debil', 'crap'];

  let severity = 0;

  severeProfanity.forEach(word => {
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(text)) severity = Math.max(severity, 3);
  });

  if (severity < 3) {
    moderateProfanity.forEach(word => {
      const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (pattern.test(text)) severity = Math.max(severity, 2);
    });
  }

  if (severity < 2) {
    mildProfanity.forEach(word => {
      const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (pattern.test(text)) severity = Math.max(severity, 1);
    });
  }

  return severity;
}