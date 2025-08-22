/**
 * Utilities para validação de documentos (CPF e CNPJ)
 */

// Função para limpar caracteres especiais do documento
export const limparDocumento = (documento: string): string => {
  return documento.replace(/\D/g, '');
};

// Função para identificar o tipo de documento pelo número de dígitos
export const identificarTipoDocumento = (documento: string): 'cpf' | 'cnpj' | 'invalido' => {
  const documentoLimpo = limparDocumento(documento);
  
  if (documentoLimpo.length === 11) {
    return 'cpf';
  } else if (documentoLimpo.length === 14) {
    return 'cnpj';
  }
  
  return 'invalido';
};

// Função para formatar CPF
export const formatarCPF = (cpf: string): string => {
  const cpfLimpo = limparDocumento(cpf);
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Função para formatar CNPJ
export const formatarCNPJ = (cnpj: string): string => {
  const cnpjLimpo = limparDocumento(cnpj);
  return cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

// Função para formatar documento automaticamente
export const formatarDocumento = (documento: string): string => {
  const tipo = identificarTipoDocumento(documento);
  
  switch (tipo) {
    case 'cpf':
      return formatarCPF(documento);
    case 'cnpj':
      return formatarCNPJ(documento);
    default:
      return documento;
  }
};

// Função para validar CPF
export const validarCPF = (cpf: string): boolean => {
  const cpfLimpo = limparDocumento(cpf);
  
  if (cpfLimpo.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(10))) return false;
  
  return true;
};

// Função para validar CNPJ
export const validarCNPJ = (cnpj: string): boolean => {
  const cnpjLimpo = limparDocumento(cnpj);
  
  if (cnpjLimpo.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  let pos = 5;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpjLimpo.charAt(i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(cnpjLimpo.charAt(12))) return false;
  
  // Validação do segundo dígito verificador
  soma = 0;
  pos = 6;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpjLimpo.charAt(i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(cnpjLimpo.charAt(13))) return false;
  
  return true;
};

// Função para validar documento automaticamente
export const validarDocumento = (documento: string): boolean => {
  const tipo = identificarTipoDocumento(documento);
  
  switch (tipo) {
    case 'cpf':
      return validarCPF(documento);
    case 'cnpj':
      return validarCNPJ(documento);
    default:
      return false;
  }
};

// Função para obter label do documento
export const getLabelDocumento = (documento: string): string => {
  const tipo = identificarTipoDocumento(documento);
  
  switch (tipo) {
    case 'cpf':
      return 'CPF';
    case 'cnpj':
      return 'CNPJ';
    default:
      return 'CPF/CNPJ';
  }
};

// Função para obter placeholder do documento
export const getPlaceholderDocumento = (documento: string): string => {
  const tipo = identificarTipoDocumento(documento);
  
  switch (tipo) {
    case 'cpf':
      return '000.000.000-00';
    case 'cnpj':
      return '00.000.000/0000-00';
    default:
      return 'Digite CPF ou CNPJ';
  }
};