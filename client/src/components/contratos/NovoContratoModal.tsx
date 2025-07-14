/**
 * Modal para geração de novos contratos
 * Formulário com dados do motorista, veículo e condições da locação
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Contrato, Motorista, Veiculo } from '@/types';
import { generateId } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import { useContratos } from '../../hooks/useContratos';

// Schema de validação
const contratoSchema = z.object({
  motoristaId: z.string().min(1, 'Motorista é obrigatório'),
  veiculoId: z.string().min(1, 'Veículo é obrigatório'),
  dataInicio: z.date({
    required_error: 'Data de início é obrigatória',
  }),
  tempoContrato: z.number().min(1, 'Tempo de contrato deve ser maior que 0'),
  valorSemanal: z.number().min(0.01, 'Valor semanal deve ser maior que 0'),
  caucao: z.number().min(0, 'Caução deve ser maior ou igual a 0'),
});

type ContratoFormData = z.infer<typeof contratoSchema>;

interface NovoContratoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContratoGerado: (contrato: Contrato) => void;
}

export function NovoContratoModal({ 
  open, 
  onOpenChange, 
  onContratoGerado 
}: NovoContratoModalProps) {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const { profile } = useAuth();
  const userProfile = profile;
  
  // Hook para gerenciar contratos
  const { createContrato } = useContratos();

  // Função para obter a data de amanhã
  const getAmanha = () => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    return amanha;
  };

  const form = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      motoristaId: '',
      veiculoId: '',
      dataInicio: getAmanha(),
      tempoContrato: 1,
      valorSemanal: 0,
      caucao: 0,
    },
  });

  // Carrega dados dos motoristas e veículos
  useEffect(() => {
    const loadData = async () => {
      if (!open || !profile?.locadoraId) return;
      
      setLoadingData(true);
      
      try {
        // Carrega motoristas
        const motoristasResponse = await fetch(`/api/motoristas?locadoraId=${profile.locadoraId}`);
        if (motoristasResponse.ok) {
          const motoristasData = await motoristasResponse.json();
          setMotoristas(motoristasData);
        }
        
        // Carrega veículos
        const veiculosResponse = await fetch(`/api/veiculos?locadoraId=${profile.locadoraId}`);
        if (veiculosResponse.ok) {
          const veiculosData = await veiculosResponse.json();
          setVeiculos(veiculosData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [open, profile?.locadoraId]);

  // Filtra apenas veículos disponíveis
  const veiculosDisponiveis = veiculos.filter(veiculo => veiculo.status === 'disponivel');

  // Altera automaticamente o valor semanal quando um veículo é selecionado
  const handleVeiculoChange = (veiculoId: string) => {
    const veiculo = veiculos.find(v => v.id === veiculoId);
    if (veiculo) {
      form.setValue('valorSemanal', Number(veiculo.valorSemanal) || 0);
      form.setValue('caucao', Number(veiculo.caucao) || 0);
    }
  };

  const onSubmit = async (data: ContratoFormData) => {
    try {
      // Busca dados do motorista e veículo selecionados
      const motorista = motoristas.find(m => m.id === data.motoristaId);
      const veiculo = veiculos.find(v => v.id === data.veiculoId);

      if (!motorista || !veiculo) {
        throw new Error('Motorista ou veículo não encontrado');
      }

      // Buscar dados da locadora
      let dadosLocadora = null;
      if (profile?.locadoraId) {
        const response = await fetch(`/api/locadoras/${profile.locadoraId}`);
        if (response.ok) {
          dadosLocadora = await response.json();
        }
      }
      
      // Usar dados reais da locadora ou dados padrão
      const locadorInfo = dadosLocadora ? {
        nome: dadosLocadora.nome,
        cnpj: dadosLocadora.cnpj,
        endereco: `${dadosLocadora.endereco}, ${dadosLocadora.cidade}/${dadosLocadora.estado} - CEP: ${dadosLocadora.cep}`,
        responsavel: dadosLocadora.responsavel
      } : {
        nome: "DRIVS LOCADORA DE VEÍCULOS LTDA",
        cnpj: "12.345.678/0001-90",
        endereco: "Rua das Empresas, 123 - Centro, Embu das Artes/SP",
        responsavel: "Responsável da Locadora"
      };

      // Calcula data final
      const dataFim = new Date(data.dataInicio);
      dataFim.setMonth(dataFim.getMonth() + data.tempoContrato);

      // Calcula valor total
      const valorMensal = data.valorSemanal * 4;
      const valorTotal = valorMensal * data.tempoContrato;

      // Cria novo contrato
      const novoContrato = {
        tipo: 'locacao' as const,
        titulo: `Contrato de Locação - ${motorista.nome}`,
        cliente: motorista.nome,
        valor: valorTotal.toString(),
        dataInicio: format(data.dataInicio, 'yyyy-MM-dd'),
        dataFim: format(dataFim, 'yyyy-MM-dd'),
        status: 'ativo' as const,
        template: `CONTRATO DE LOCAÇÃO DE VEÍCULO

LOCADOR: ${locadorInfo.nome}, Ramo de atividade: Locação de Veículos, portador do CNPJ: ${locadorInfo.cnpj}, cuja
sede se encontra na ${locadorInfo.endereco}. 

LOCATÁRIO: ${motorista.nome}, nascido em ${motorista.dataNascimento},
profissão: Motorista de Aplicativo, portador (a) do CPF nº ${motorista.cpf} - RG: ${motorista.rg} CNH: ${motorista.cnh} Telefone: ${motorista.telefone}
SSP/SP, residente e domiciliado: ${motorista.rua}, ${motorista.numero} - ${motorista.bairro}, ${motorista.cidade}/${motorista.estado} - CEP: ${motorista.cep}. As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Locação de
Automóvel que se regerá pelas cláusulas seguintes e pelas condições descritas no presente.

1. CLÁUSULA PRIMEIRA – DO OBJETO, PRAZO E USO
1.1. O LOCADOR declara ser o legítimo possuidor e/ou proprietário do veículo de modelo ${veiculo.modelo}, marca ${veiculo.marca}, ano
${veiculo.ano}, cor ${veiculo.cor}, placa ${veiculo.placa}, licenciado no Estado de São Paulo, chassi ${veiculo.chassi} e
Renavam ${veiculo.renavam}, Vistoriado com fotos e video no dia da retirada, e que resolveu dá-lo em locação ao LOCATÁRIO pelo prazo de ${data.tempoContrato} mês(es)
contados a partir da assinatura do presente contrato.

1.2. Findo o prazo acima estipulado, o contrato poderá ser renovado automaticamente, desde que seja do desejo de
ambas as partes, ou o veículo deverá ser devolvido ao LOCADOR nas mesmas condições em que estava quando foi
recebido, ou seja, em perfeitas condições de uso, respondendo o LOCATÁRIO pelos danos ou prejuízos causados e pela
devolução do veículo após o término do contrato.
1.2.1. Caso o LOCATÁRIO não pague o aluguel na data estipulada, após 02 dias de vencido, além dos juros e multa por
atraso, o veículo será recolhido, e as diárias serão cobradas normalmente, mesmo sem a utilização dele. O veículo só
será liberado ao LOCATÁRIO novamente após a quitação dos débitos pendentes.
1.3. Caso o LOCATÁRIO não restituir o automóvel na data estipulada, deverá pagar, enquanto detiver em seu poder, o
valor da locação que o LOCADOR arbitrar, e responderá pelo dano que o automóvel venha a sofrer, mesmo se
proveniente de caso fortuito.
1.4. Uso Exclusivo e Restrições de Localidade
O veículo locado será destinado exclusivamente ao uso nas plataformas de transporte de passageiros, como UBER, 99,
CABIFY e outros aplicativos similares, somente dentro do estado de São Paulo. É expressamente proibida a utilização
do veículo fora do estado de São Paulo, bem como o empréstimo, sublocação ou qualquer transferência de posse a
terceiros. O descumprimento desta cláusula resultará em multa de 02 semanais do veículo, além da remoção imediata
do veículo.
Adicionalmente, a empresa arcará com os custos de guincho em um raio de até 100 km da nossa base. Caso o veículo
necessite de remoção em uma distância superior, o custo adicional do guincho e as horas necessárias até a chegada do
veículo à mecânica serão cobrados do motorista responsável.
1.5. O bem locado apenas poderá ser dirigido pelo LOCATÁRIO. Havendo qualquer tipo de problema no veículo ou
alteração no endereço do LOCATÁRIO, o mesmo deverá comunicar imediatamente ao LOCADOR.

2. CLÁUSULA SEGUNDA – DO VALOR
2.1. O LOCATÁRIO pagará ao LOCADOR, a título de locação, o valor semanal de R$ ${parseFloat(data.valorSemanal).toFixed(2)}.
2.2. O pagamento será feito toda segunda-feira, via depósito em conta do LOCADOR, e o atraso no pagamento do acordo
da cláusula acima enseja multa de 10% (dez por cento) e juros de 2% (dois por cento) ao dia.

3. CLÁUSULA TERCEIRA – DAS OBRIGAÇÕES
3.1. No caso de o veículo ficar parado em oficina, se por desgaste natural nas manutenções, o carro que ultrapassar 08
horas parado terá os dias/horas abonados do aluguel semanal. Se a paralisação for por má utilização do condutor, os
dias/períodos parados serão cobrados normalmente do aluguel.
3.2. É de inteira responsabilidade do LOCATÁRIO os débitos sobre infrações de trânsito (multas), e que seus pontos
sejam repassados/transmitidos de imediato, mais o pagamento de 20% sobre o valor da multa. Caso não transfira em
até 10 dias, o LOCADOR poderá solicitar o carro, e o LOCATÁRIO pagará o valor dobrado da multa.
3.3. O veículo alugado possui seguro contra roubo, furto, colisões e perda total (PT). Em caso de sinistro, o seguro será
acionado, e o motorista será responsável pelo pagamento dos dias em que o veículo permanecer fora de circulação até
que volte a estar disponível para uso, além de arcar com 10% do valor do carro, correspondente à franquia. Caso a
seguradora rejeite a cobertura por qualquer motivo, o motorista deverá pagar o valor integral do veículo conforme a
tabela FIPE vigente na data do sinistro.

4. CLÁUSULA QUARTA - Vistorias
Fica determinado entre as partes que o LOCATÁRIO tem direito a duas vistorias mensais no veículo, cujo dia fica a
combinar entre ambas as partes.

5. CLÁUSULA QUINTA - Verificações do LOCADOR
É de total responsabilidade do LOCADOR a verificação diária da água do radiador e do óleo. Em caso de falta, deverá
avisar ao LOCATÁRIO, e em hipótese alguma deve andar com o veículo fervendo ou sem óleo, caso o motorista ande com veículo nessas condições ele será responsável pelos danos.

6. CLÁUSULA SEXTA– DA RESCISÃO / CAUÇÃO
6.1. A rescisão, antes do vencimento contratual, por iniciativa de qualquer das partes, deverá ser precedida de
notificação expressa com antecedência mínima de 1 mês. Caso não haja essa notificação, haverá multa por quebra do
contrato no valor de 02 semanais do veículo.
6.2. A caução no valor de R$ ${parseFloat(data.caucao).toFixed(2)} será devolvida no término do contrato, após o prazo de 30 dias úteis, desde que não haja nenhuma avaria
ou infração pendente.
6.3. O descumprimento de qualquer uma das cláusulas por parte dos contratantes ensejará a rescisão deste
instrumento e o devido pagamento de multa pela parte inadimplente, no valor correspondente a 02 semanas de
locação.

7. CLÁUSULA SÉTIMA - Limite de Quilometragem Mensal
Fica estipulado o limite mensal de quilometragem de ${veiculo.valorLimiteKm ? `${veiculo.valorLimiteKm * 4} km` : 'ILIMITADO'} para o veículo alugado. Caso o condutor exceda esse
limite, será cobrado o valor de R$ 0,50 (cinquenta centavos) por quilômetro excedido.

8. CLÁUSULA OITAVA - Responsabilidade por Batidas e Reparos
Em caso de colisão, batida simples ou qualquer tipo de acidente envolvendo o veículo locado, o motorista é obrigado
a comunicar a empresa imediatamente após o ocorrido.
Todos os custos relacionados aos reparos serão de total responsabilidade do motorista, incluindo as diárias em que o
veículo estiver parado para conserto. Durante o período de reparo, o valor das diárias será cobrado até que o veículo
esteja em plenas condições de uso.
Além disso, a empresa se reserva o direito de não devolver o veículo ao motorista caso considere necessário, seja por
motivos de má utilização, recorrência de acidentes ou qualquer outra razão que comprometa a segurança do veículo
ou a operação.

9. CLÁUSULA NONA – DAS DISPOSIÇÕES GERAIS
As partes contratantes
elegem o foro de Embu das Artes para dirimir qualquer ação oriunda deste contrato. E, por estarem justas e
contratadas, assinam o presente instrumento em Embu das Artes - SP, ${format(data.dataInicio, 'dd/MM/yyyy')}.



            __________________                          __________________
            ${motorista.nome}                          ${locadorInfo.responsavel}
                LOCATÁRIO                                    LOCADORA

Contrato gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`
      };

      // Usa o hook para criar o contrato
      const contratoCriado = await createContrato.mutateAsync(novoContrato);
      
      onContratoGerado(contratoCriado);
      onOpenChange(false);
      form.reset();
      
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      console.error('Stack trace:', error.stack);
      console.error('Dados do contrato:', { motorista, veiculo, data, userProfile });
    } finally {
      // setLoading(false); // Removido porque não usamos mais loading local
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar Novo Contrato</DialogTitle>
          <DialogDescription>
            Preencha as informações para gerar um contrato de locação.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* MOTORISTA */}
              <FormField
                control={form.control}
                name="motoristaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motorista *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um motorista" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {motoristas.length > 0 ? (
                          motoristas.map((motorista) => (
                            <SelectItem key={motorista.id} value={motorista.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{motorista.nome}</span>
                                <span className="text-sm text-muted-foreground">
                                  {motorista.cpf} • CNH: {motorista.cnh}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            Nenhum motorista disponível
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* VEÍCULO */}
              <FormField
                control={form.control}
                name="veiculoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veículo *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleVeiculoChange(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um veículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {veiculosDisponiveis.length > 0 ? (
                          veiculosDisponiveis.map((veiculo) => (
                            <SelectItem key={veiculo.id} value={veiculo.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {veiculo.marca} {veiculo.modelo} - {veiculo.placa}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  R$ {Number(veiculo.valorSemanal).toFixed(2)}/semana • {veiculo.cor} • {veiculo.ano}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            Nenhum veículo disponível
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* DATA DE INÍCIO */}
              <FormField
                control={form.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>dd/mm/aaaa</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const hoje = new Date();
                            hoje.setHours(0, 0, 0, 0);
                            return date < hoje;
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* TEMPO DE CONTRATO */}
              <FormField
                control={form.control}
                name="tempoContrato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempo de Contrato (meses) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        placeholder="1" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* VALOR SEMANAL E CAUÇÃO */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valorSemanal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Semanal (R$) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0.01"
                          placeholder="Preenchido automaticamente"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="caucao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caução (R$) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          min="0"
                          placeholder="Preenchido automaticamente"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={createContrato.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createContrato.isPending}>
                  {createContrato.isPending ? 'Gerando...' : 'Gerar Contrato'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}