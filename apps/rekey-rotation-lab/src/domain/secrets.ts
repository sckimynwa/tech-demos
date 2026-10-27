/** Fake OpenAI-style credentials. The middle is never shown in the UI. */
export const OLD_CREDENTIAL = "sk-proj-FAKEOLDKEY0001demoNOTREAL-wxyz";
export const NEW_CREDENTIAL = "sk-proj-FAKENEWKEY0002demoNOTREAL-abcd";

/** Substring that must not appear in timeline logs or masked UI. */
export const SECRET_BODY = "demoNOTREAL";

export const MASK_PREFIX_LEN = 12;
export const MASK_TAIL_LEN = 4;

export const VAULT_NAME = "Acme - Prod";
export const ADMIN_VAULT_NAME = "Acme - Admin";
export const ITEM_NAME = "shop.openai";
export const OP_REF = "op://Acme - Prod/shop.openai/credential";

/** Matches rekey `key_name("shop.openai")` with a fixed stamp. */
export const ISSUED_KEY_NAME = "rekey_shop_openai_20261027_0015";

export const STEP_DELAY_MS = 880;

export function maskSecret(value: string): string {
  const minimum = MASK_PREFIX_LEN + MASK_TAIL_LEN + 1;
  if (value.length <= minimum) {
    return "•".repeat(Math.max(value.length, 4));
  }
  return `${value.slice(0, MASK_PREFIX_LEN)}…${value.slice(-MASK_TAIL_LEN)}`;
}
