/**
 * Utility formatters for the financial module.
 */

/**
 * Formats a number as BRL currency.
 */
export const formatCurrencyBRL = (value: number | string | undefined): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === undefined || isNaN(num)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
};

/**
 * Formats a date string to pt-BR format (DD/MM/YYYY).
 */
export const formatDateBR = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Data Inválida';
  // Use UTC to avoid timezone shifts if the date is just YYYY-MM-DD
  if (dateString.length === 10) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
  }
  return date.toLocaleDateString('pt-BR');
};

/**
 * Safely converts a string to lowercase with fallback.
 */
export const safeLower = (value: string | undefined | null): string => {
  return (value ?? '').toLowerCase();
};

/**
 * Formats a month string (YYYY-MM) to long month name and year (e.g., FEVEREIRO 2026).
 */
export const formatMonthYear = (monthStr: string): string => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
};
