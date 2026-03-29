// =============================================================================
// Muhandes HUB — DeepL Translator Integration
// =============================================================================

const DEEPL_ENDPOINT = 'https://api-free.deepl.com/v2';
const MAX_TEXT_LENGTH = 5000;

// DeepL uses uppercase language codes, with 'EN' (not 'EN-US') for English
function toDeepLLang(lang: 'ar' | 'en'): string {
  return lang === 'ar' ? 'AR' : 'EN';
}

// ---------------------------------------------------------------------------
// Core: translate a single string
// ---------------------------------------------------------------------------
export async function translateText(
  text: string,
  from: 'ar' | 'en',
  to: 'ar' | 'en',
): Promise<string | null> {
  const key = process.env.DEEPL_API_KEY;

  if (!key) {
    console.warn('[translate] DEEPL_API_KEY not configured');
    return null;
  }

  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_TEXT_LENGTH) return null;

  try {
    const params = new URLSearchParams({
      text: trimmed,
      source_lang: toDeepLLang(from),
      target_lang: toDeepLLang(to),
    });

    const res = await fetch(`${DEEPL_ENDPOINT}/translate`, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      console.error('[translate] DeepL API error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data?.translations?.[0]?.text ?? null;
  } catch (err) {
    console.error('[translate] Network error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Batch: translate multiple strings in one API call (max 50 items per DeepL)
// ---------------------------------------------------------------------------
export async function translateBatch(
  items: string[],
  from: 'ar' | 'en',
  to: 'ar' | 'en',
): Promise<(string | null)[]> {
  const key = process.env.DEEPL_API_KEY;

  if (!key) return items.map(() => null);

  const filtered = items.map((t) => t.trim());
  // Track which indices have valid text and which are null
  const validIndices: number[] = [];
  const textsToSend: string[] = [];

  filtered.forEach((t, i) => {
    if (t && t.length <= MAX_TEXT_LENGTH) {
      validIndices.push(i);
      textsToSend.push(t);
    }
  });

  if (textsToSend.length === 0) return items.map(() => null);

  try {
    // DeepL accepts multiple `text` params for batch translation
    const params = new URLSearchParams({
      source_lang: toDeepLLang(from),
      target_lang: toDeepLLang(to),
    });
    for (const t of textsToSend) {
      params.append('text', t);
    }

    const res = await fetch(`${DEEPL_ENDPOINT}/translate`, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      console.error('[translate] DeepL batch error:', res.status);
      return items.map(() => null);
    }

    const data = await res.json();
    const translations: (string | null)[] = items.map(() => null);

    validIndices.forEach((origIdx, batchIdx) => {
      translations[origIdx] = data?.translations?.[batchIdx]?.text ?? null;
    });

    return translations;
  } catch (err) {
    console.error('[translate] Batch network error:', err);
    return items.map(() => null);
  }
}

// ---------------------------------------------------------------------------
// Higher-level: auto-translate missing bilingual fields
// Used in server actions as a safety-net before DB insert
// ---------------------------------------------------------------------------
export async function autoTranslateBilingualFields(
  data: Record<string, unknown>,
  fieldBases: string[],
): Promise<Record<string, unknown>> {
  const result = { ...data };
  const toTranslate: { base: string; from: 'ar' | 'en'; to: 'ar' | 'en'; text: string }[] = [];

  for (const base of fieldBases) {
    const arRaw = data[`${base}_ar`];
    const enRaw = data[`${base}_en`];
    const arVal = typeof arRaw === 'string' ? arRaw.trim() : '';
    const enVal = typeof enRaw === 'string' ? enRaw.trim() : '';

    if (arVal && !enVal) {
      toTranslate.push({ base, from: 'ar', to: 'en', text: arVal });
    } else if (enVal && !arVal) {
      toTranslate.push({ base, from: 'en', to: 'ar', text: enVal });
    }
  }

  if (toTranslate.length === 0) return result;

  // Batch all ar→en together and en→ar together for efficiency
  const arToEn = toTranslate.filter((t) => t.from === 'ar');
  const enToAr = toTranslate.filter((t) => t.from === 'en');

  const [arToEnResults, enToArResults] = await Promise.all([
    arToEn.length > 0 ? translateBatch(arToEn.map((t) => t.text), 'ar', 'en') : [],
    enToAr.length > 0 ? translateBatch(enToAr.map((t) => t.text), 'en', 'ar') : [],
  ]);

  // Apply ar→en results
  arToEn.forEach((item, i) => {
    const translated = arToEnResults[i];
    // Fallback: copy original text if translation fails (wrong language > empty)
    result[`${item.base}_en`] = translated || item.text;
  });

  // Apply en→ar results
  enToAr.forEach((item, i) => {
    const translated = enToArResults[i];
    result[`${item.base}_ar`] = translated || item.text;
  });

  return result;
}
