export function luhn(num: string) {
  const digits = num.replace(/\s+/g, "");
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let alternate = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let value = Number(digits[index]);
    if (alternate) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function cardBrand(num: string) {
  const digits = num.replace(/\s+/g, "");
  if (digits.startsWith("4")) return "Visa";
  if (digits.startsWith("34") || digits.startsWith("37")) return "Amex";
  if (/^5[1-5]/.test(digits) || /^2(2|3|4|5|6|7)/.test(digits)) return "Mastercard";
  return "Card";
}

export function formatCardNumber(value: string) {
  return value
    .replace(/[^\d]/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}
