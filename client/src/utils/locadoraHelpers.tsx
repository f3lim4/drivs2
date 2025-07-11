/**
 * Helper functions for Locadora operations
 */

import { Badge } from '@/components/ui/badge';
import { Locadora, LocadoraModal } from '@/types/locadora';

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ativa':
      return <Badge variant="default" className="bg-green-100 text-green-800">Ativa</Badge>;
    case 'inativa':
      return <Badge variant="secondary">Inativa</Badge>;
    case 'pendente':
      return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export const getPlanoBadge = (plano: string) => {
  switch (plano) {
    case 'basico':
      return <Badge variant="outline">Básico</Badge>;
    case 'premium':
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Premium</Badge>;
    case 'enterprise':
      return <Badge variant="default" className="bg-purple-100 text-purple-800">Enterprise</Badge>;
    default:
      return <Badge variant="outline">{plano}</Badge>;
  }
};

export const convertToModalFormat = (locadora: Locadora): LocadoraModal => ({
  id: locadora.id,
  nome: locadora.nome,
  razaoSocial: locadora.razao_social,
  cnpj: locadora.cnpj,
  email: locadora.email,
  telefone: locadora.telefone,
  endereco: locadora.endereco,
  cidade: locadora.cidade,
  estado: locadora.estado,
  cep: locadora.cep,
  responsavel: locadora.responsavel,
  status: locadora.status,
  plano: locadora.plano,
  dataCadastro: locadora.created_at
});

export const filterLocadoras = (locadoras: Locadora[], searchTerm: string) => {
  return locadoras.filter(locadora =>
    locadora.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locadora.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locadora.cnpj.includes(searchTerm) ||
    locadora.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );
};