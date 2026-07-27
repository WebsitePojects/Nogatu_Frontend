// Maps a failed registration API response into an encoder-friendly modal
// presentation: a specific title, the server's own message (untouched), a
// short "what to do" hint, which form field (if any) to highlight, and any
// extra detail rows (e.g. duplicate-account match info).
//
// Backend contract (registration write endpoints — /registration/register,
// /registration/public-register) on failure, HTTP 400:
//   { error, errorCode, field, popup: true, duplicatePolicy? }
//   errorCode: MISSING_FIELD | INVALID_TIN | INVALID_EMAIL | USERNAME_TAKEN
//            | DUPLICATE_ACCOUNT | PLACEMENT_LOCKED | INVALID_CODE
//            | CODE_ALREADY_USED | REGISTRATION_FAILED
//   field: tin | email | username | address | firstname | lastname | null
//   duplicatePolicy (DUPLICATE_ACCOUNT only): { blocked, rule, matchedUsername }
//
// This must stay robust against an older backend that has not shipped
// errorCode/field yet, and against network failures / non-JSON error bodies
// that carry no parseable payload at all — both fall back to a generic
// "Registration failed" presentation with whatever message is available.
// Never fabricate details that aren't present in the response (fail closed:
// an unrecognized field name is dropped, not guessed at).

// Only fields that actually exist as inputs on the registration forms are
// ever surfaced for highlighting — anything else from the server is ignored.
export const FIELD_LABELS = {
  tin: 'TIN',
  email: 'Email',
  username: 'Username',
  address: 'Address',
  firstname: 'First Name',
  lastname: 'Last Name',
};

const DUPLICATE_RULE_LABELS = {
  tin: 'Same TIN number as an existing account',
  name_exact: 'Exact name match with an existing account',
  name_switched: 'First/last name match an existing account (order switched)',
  name_similar_dob: 'Similar name + same date of birth as an existing account',
};

function missingFieldTitle(field) {
  const label = field ? FIELD_LABELS[field] : null;
  return label ? `${label} is required` : 'A required field is missing';
}

const PRESENTATIONS = {
  MISSING_FIELD: {
    title: missingFieldTitle,
    hint: 'Fill in the missing field and submit again.',
  },
  INVALID_TIN: {
    title: 'Invalid TIN number',
    hint: 'Enter the TIN in the correct format, or leave it blank if not available.',
  },
  INVALID_EMAIL: {
    title: 'Invalid email address',
    hint: 'Enter a valid email address, e.g. name@example.com.',
  },
  USERNAME_TAKEN: {
    title: 'Username already exists',
    hint: 'Choose a different username.',
  },
  DUPLICATE_ACCOUNT: {
    title: 'Duplicate member detected',
    hint: 'Verify with the member if they already have an account. Our policy allows one account per person.',
  },
  PLACEMENT_LOCKED: {
    title: 'Placement slot is no longer available',
    hint: 'Refresh the page to get the current placement, then try again.',
  },
  INVALID_CODE: {
    title: 'Invalid activation code',
    hint: 'Double-check the activation code, or select a different one from the list.',
  },
  CODE_ALREADY_USED: {
    title: 'Activation code already used',
    hint: 'This code has already been consumed — select a different available code.',
  },
  REGISTRATION_FAILED: {
    title: 'Registration failed',
    hint: null,
  },
};

/**
 * @param {*} data - parsed JSON body of a failed registration response. May be
 *   null/undefined (network error, no body) or a non-object (plain text /
 *   HTML error page) — every property access below is guarded for that.
 * @param {string} [fallbackMessage] - message to show when the response has
 *   no usable `error` string. Callers should pass whatever their own
 *   pre-existing fallback literal was, so behavior is unchanged when the
 *   backend hasn't shipped the new contract yet.
 * @returns {{ title: string, message: string, hint: string|null, field: string|null, details: Array<{label:string,value:string}> }}
 */
export function getRegistrationErrorPresentation(data, fallbackMessage) {
  const hasErrorString = data && typeof data.error === 'string' && data.error.trim().length > 0;
  const serverMessage = hasErrorString
    ? data.error
    : (fallbackMessage || 'Registration failed. Please check your connection and try again.');

  const code = data && typeof data.errorCode === 'string' ? data.errorCode : null;
  const rawField = data && typeof data.field === 'string' ? data.field : null;
  // Fail closed: only accept a field name that maps to a real input.
  const field = rawField && FIELD_LABELS[rawField] ? rawField : null;

  const presentation = (code && PRESENTATIONS[code]) || PRESENTATIONS.REGISTRATION_FAILED;
  const title = typeof presentation.title === 'function' ? presentation.title(field) : presentation.title;

  const details = [];
  if (code === 'DUPLICATE_ACCOUNT' && data && typeof data.duplicatePolicy === 'object' && data.duplicatePolicy) {
    const { rule, matchedUsername } = data.duplicatePolicy;
    if (matchedUsername) {
      details.push({ label: 'Matched account', value: String(matchedUsername) });
    }
    const ruleLabel = rule ? (DUPLICATE_RULE_LABELS[rule] || String(rule)) : null;
    if (ruleLabel) {
      details.push({ label: 'Match reason', value: ruleLabel });
    }
  }

  return {
    title,
    message: serverMessage,
    hint: presentation.hint || null,
    field,
    details,
  };
}
