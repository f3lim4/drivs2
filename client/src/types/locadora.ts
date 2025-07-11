/**
 * Types and interfaces for Locadora entities
 */

export interface Locadora {
  id: string;
  nome: string;
  razao_social: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  responsavel: string;
  status: 'ativa' | 'inativa' | 'pendente';
  plano: 'basico' | 'premium' | 'enterprise';
  created_at: string;
}

// Interface for compatibility with modal components
export interface LocadoraModal {
  id: string;
  nome: string;
  razaoSocial: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  responsavel: string;
  status: 'ativa' | 'inativa' | 'pendente';
  plano: 'basico' | 'premium' | 'enterprise';
  dataCadastro: string;
}