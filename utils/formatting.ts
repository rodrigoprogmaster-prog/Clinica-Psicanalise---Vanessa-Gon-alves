
export const formatCurrency = (value: string): string => {
  if (!value) return '';
  let numericValue = value.replace(/\D/g, '');
  if (numericValue === '') return '';

  numericValue = numericValue.padStart(3, '0');

  const integerPart = numericValue.slice(0, -2);
  const decimalPart = numericValue.slice(-2);
  
  const formattedIntegerPart = new Intl.NumberFormat('pt-BR').format(parseInt(integerPart, 10) || 0);

  return `R$ ${formattedIntegerPart},${decimalPart}`;
};

export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  const numericValue = value.replace(/\D/g, '');
  if (numericValue === '') return 0;
  return parseFloat(numericValue) / 100;
};

/**
 * Returns the current date as a string in YYYY-MM-DD format,
 * respecting the user's local timezone.
 */
export const getTodayString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}
