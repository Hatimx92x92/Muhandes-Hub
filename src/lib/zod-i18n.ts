// =============================================================================
// Zod i18n — Localize field errors based on current locale
// =============================================================================

type FieldErrors = Record<string, string[]>;

const arMessages: Record<string, string> = {
  // Generic
  'Required': 'مطلوب',
  'Invalid input': 'إدخال غير صالح',
  'Expected string, received number': 'يجب أن يكون نصاً',
  'Expected number, received string': 'يجب أن يكون رقماً',
  'Expected number, received nan': 'يجب أن يكون رقماً صحيحاً',

  // Auth
  'Invalid email address': 'البريد الإلكتروني غير صالح',
  'Invalid email': 'البريد الإلكتروني غير صالح',
  'Password is required': 'كلمة المرور مطلوبة',
  'Password must be at least 8 characters': 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
  'Password must not exceed 72 characters': 'كلمة المرور يجب ألا تتجاوز 72 حرفاً',
  'Passwords do not match': 'كلمات المرور غير متطابقة',
  'Please select a role': 'يرجى اختيار الدور',
  'Phone number must be 9 digits after +966': 'رقم الهاتف يجب أن يكون 9 أرقام بعد 966+',

  // Fields
  'Name is required': 'الاسم مطلوب',
  'Company name is required': 'اسم الشركة مطلوب',

  // Content
  'At least one language is required for title (min 5 characters)': 'يجب إدخال العنوان بلغة واحدة على الأقل (5 أحرف كحد أدنى)',
  'At least one language is required for description (min 20 characters)': 'يجب إدخال الوصف بلغة واحدة على الأقل (20 حرفاً كحد أدنى)',
  'Maximum must be greater than minimum': 'يجب أن يكون الحد الأقصى أكبر من الحد الأدنى',
  'Maximum must be greater than or equal to minimum': 'يجب أن يكون الحد الأقصى أكبر من أو يساوي الحد الأدنى',
  'End date must be after start date': 'يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء',
  'Price is required for fixed-price products': 'السعر مطلوب للمنتجات ذات السعر الثابت',
  'At least one variant is required': 'يجب إضافة خيار واحد على الأقل',

  // Contact
  'Message must be at least 10 characters': 'يجب أن تكون الرسالة 10 أحرف على الأقل',
  'Message is too long': 'الرسالة طويلة جداً',
};

// Regex patterns for dynamic messages
const arPatterns: [RegExp, (match: RegExpMatchArray) => string][] = [
  [
    /^String must contain at least (\d+) character/,
    (m) => `يجب أن يكون ${m[1]} أحرف على الأقل`,
  ],
  [
    /^String must contain at most (\d+) character/,
    (m) => `يجب ألا يتجاوز ${m[1]} حرفاً`,
  ],
  [
    /^Number must be greater than or equal to (\d+)/,
    (m) => `يجب أن يكون ${m[1]} على الأقل`,
  ],
  [
    /^Number must be less than or equal to (\d+)/,
    (m) => `يجب ألا يتجاوز ${m[1]}`,
  ],
  [
    /^Array must contain at least (\d+) element/,
    (m) => `يجب اختيار ${m[1]} عناصر على الأقل`,
  ],
  [
    /^At least one language is required for (.+) \(min (\d+) characters\)/,
    (m) => `يجب إدخال ${m[1]} بلغة واحدة على الأقل (${m[2]} أحرف كحد أدنى)`,
  ],
];

function translateMessage(msg: string): string {
  // Direct match
  if (arMessages[msg]) return arMessages[msg];

  // Pattern match
  for (const [pattern, formatter] of arPatterns) {
    const match = msg.match(pattern);
    if (match) return formatter(match);
  }

  return msg;
}

/**
 * Localize Zod field errors to the given locale.
 * Pass locale='ar' to get Arabic messages, otherwise returns English as-is.
 */
export function localizeFieldErrors(
  fieldErrors: FieldErrors,
  locale: string,
): FieldErrors {
  if (locale !== 'ar') return fieldErrors;

  const localized: FieldErrors = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    localized[field] = messages.map(translateMessage);
  }
  return localized;
}
