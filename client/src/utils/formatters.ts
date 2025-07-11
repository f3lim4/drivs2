/**
 * Utilitários de formatação para o sistema DRIVS
 * Funções auxiliares para formatação de dados, datas, valores, etc.
 */

/**
 * Formata valor monetário para Real brasileiro
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata CPF com máscara
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNH com máscara
 */
export function formatCNH(cnh: string): string {
  const cleaned = cnh.replace(/\D/g, '');
  return cleaned.replace(/(\d{11})/, '$1');
}

/**
 * Formata telefone com máscara
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

/**
 * Formata placa de veículo
 */
export function formatPlate(plate: string): string {
  const cleaned = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Formato antigo: ABC-1234
  if (cleaned.length === 7 && /^[A-Z]{3}[0-9]{4}$/.test(cleaned)) {
    return cleaned.replace(/([A-Z]{3})([0-9]{4})/, '$1-$2');
  }
  
  // Formato Mercosul: ABC1D23
  if (cleaned.length === 7 && /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(cleaned)) {
    return cleaned.replace(/([A-Z]{3})([0-9][A-Z][0-9]{2})/, '$1$2');
  }
  
  return plate;
}

/**
 * Formata data para exibição (DD/MM/AAAA)
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj);
}

/**
 * Formata data e hora para exibição (DD/MM/AAAA HH:mm)
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

/**
 * Calcula diferença em dias entre duas datas
 */
export function daysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Capitaliza primeira letra de cada palavra
 */
export function capitalizeWords(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Trunca texto com reticências
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Valida CPF
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (parseInt(cleaned.charAt(9)) !== digit) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (parseInt(cleaned.charAt(10)) !== digit) return false;
  
  return true;
}

/**
 * Gera ID único simples
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}