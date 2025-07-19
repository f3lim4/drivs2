import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export function VariaveisTemplate() {
  const variaveisLocadora = [
    { nome: '{{nomeLocadora}}', descricao: 'Nome da empresa' },
    { nome: '{{cnpjLocadora}}', descricao: 'CNPJ da locadora' },
    { nome: '{{telefoneLocadora}}', descricao: 'Telefone' },
    { nome: '{{emailLocadora}}', descricao: 'E-mail' },
    { nome: '{{enderecoLocadora}}', descricao: 'Endereço completo' },
    { nome: '{{responsavelLocadora}}', descricao: 'Responsável' },
  ];

  const variaveisMotorista = [
    { nome: '{{nomeMotorista}}', descricao: 'Nome completo' },
    { nome: '{{cpfMotorista}}', descricao: 'CPF' },
    { nome: '{{rgMotorista}}', descricao: 'RG' },
    { nome: '{{telefoneMotorista}}', descricao: 'Telefone' },
    { nome: '{{emailMotorista}}', descricao: 'E-mail' },
    { nome: '{{enderecoMotorista}}', descricao: 'Endereço' },
    { nome: '{{cnhMotorista}}', descricao: 'Número da CNH' },
    { nome: '{{vencimentoCnh}}', descricao: 'Data vencimento' },
  ];

  const variaveisContrato = [
    { nome: '{{placaVeiculo}}', descricao: 'Placa do veículo' },
    { nome: '{{marcaVeiculo}}', descricao: 'Marca' },
    { nome: '{{modeloVeiculo}}', descricao: 'Modelo' },
    { nome: '{{anoVeiculo}}', descricao: 'Ano' },
    { nome: '{{corVeiculo}}', descricao: 'Cor' },
    { nome: '{{valorSemanal}}', descricao: 'Valor semanal' },
    { nome: '{{valorMensal}}', descricao: 'Valor mensal' },
    { nome: '{{caucao}}', descricao: 'Valor da caução' },
    { nome: '{{dataInicio}}', descricao: 'Data de início' },
    { nome: '{{dataFim}}', descricao: 'Data de fim' },
    { nome: '{{limiteKm}}', descricao: 'Limite quilometragem' },
    { nome: '{{dataAtual}}', descricao: 'Data atual' },
  ];

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Variáveis Disponíveis para Templates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Dados da Locadora */}
          <div>
            <h4 className="font-semibold text-blue-800 mb-3 border-b border-blue-200 pb-1">Dados da Locadora</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
              {variaveisLocadora.map((variavel, index) => (
                <div key={index} className="flex flex-col bg-blue-100/30 p-2 rounded">
                  <code className="font-mono text-blue-800 font-semibold">{variavel.nome}</code>
                  <span className="text-xs text-blue-600">{variavel.descricao}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Dados do Motorista */}
          <div>
            <h4 className="font-semibold text-blue-800 mb-3 border-b border-blue-200 pb-1">Dados do Motorista</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
              {variaveisMotorista.map((variavel, index) => (
                <div key={index} className="flex flex-col bg-blue-100/30 p-2 rounded">
                  <code className="font-mono text-blue-800 font-semibold">{variavel.nome}</code>
                  <span className="text-xs text-blue-600">{variavel.descricao}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Dados do Contrato */}
          <div>
            <h4 className="font-semibold text-blue-800 mb-3 border-b border-blue-200 pb-1">Dados do Contrato</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
              {variaveisContrato.map((variavel, index) => (
                <div key={index} className="flex flex-col bg-blue-100/30 p-2 rounded">
                  <code className="font-mono text-blue-800 font-semibold">{variavel.nome}</code>
                  <span className="text-xs text-blue-600">{variavel.descricao}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Como usar:</strong> Copie as variáveis acima e cole no seu template. 
            Elas serão automaticamente substituídas pelos dados reais do contrato.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}