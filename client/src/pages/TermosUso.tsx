/**
 * Página de Termos de Uso
 * Exibe os termos e condições do sistema DRIVS
 */

import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import drivsLogo from "@/assets/drivs-logo.png";

export default function TermosUso() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-4 overflow-hidden">
      {/* Animated Background Elements - mesmo do login */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Animated Lines */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent animate-pulse"></div>
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse delay-700"></div>
      </div>
      
      <div className="relative z-10 container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10 text-white hover:text-cyan-400 hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img 
              src={drivsLogo} 
              alt="DRIVS" 
              className="h-8 w-auto"
            />
          </div>
        </div>

        {/* Conteúdo dos Termos */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">Termos de Uso - DRIVS</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Última atualização: 23 de julho de 2025
            </p>
          </CardHeader>
          
          <CardContent className="max-h-96 overflow-y-auto">
            <div className="space-y-6 text-gray-700">
              
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">1. ACEITAÇÃO DOS TERMOS</h3>
                <p className="mb-3">
                  Ao acessar e utilizar o sistema DRIVS (Plataforma de Gestão para Locadoras de Veículos), 
                  você concorda em cumprir e estar sujeito aos presentes Termos de Uso. Se você não concordar 
                  com qualquer parte destes termos, não deve utilizar nossos serviços.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2. DESCRIÇÃO DO SERVIÇO</h3>
                <p className="mb-3">
                  O DRIVS é uma plataforma digital que oferece ferramentas para gestão completa de locadoras 
                  de veículos, incluindo:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Cadastro e gerenciamento de motoristas, veículos e contratos</li>
                  <li>Sistema de pagamentos automáticos e controle financeiro</li>
                  <li>Relatórios gerenciais e análises de desempenho</li>
                  <li>Controle de manutenções e infrações</li>
                  <li>Geração automática de documentos e contratos</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3. CADASTRO E CONTA DE USUÁRIO</h3>
                <p className="mb-3">
                  Para utilizar o DRIVS, você deve:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Fornecer informações verdadeiras, precisas e completas durante o cadastro</li>
                  <li>Manter seus dados atualizados</li>
                  <li>Ser responsável pela confidencialidade de sua senha</li>
                  <li>Notificar imediatamente sobre qualquer uso não autorizado de sua conta</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4. PERÍODO DE TESTE GRATUITO</h3>
                <p className="mb-3">
                  Oferecemos um período de teste gratuito de 7 (sete) dias para novas locadoras. Durante 
                  este período, você terá acesso completo às funcionalidades da plataforma. Após o término 
                  do período de teste, será necessário contratar um plano de assinatura para continuar 
                  utilizando o sistema.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5. PROTEÇÃO DE DADOS</h3>
                <p className="mb-3">
                  Respeitamos sua privacidade e protegemos seus dados conforme a Lei Geral de Proteção 
                  de Dados (LGPD). Os dados coletados são utilizados exclusivamente para:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Prestação dos serviços contratados</li>
                  <li>Suporte técnico e atendimento ao cliente</li>
                  <li>Melhorias na plataforma e desenvolvimento de novos recursos</li>
                  <li>Comunicações relevantes sobre o serviço</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6. RESPONSABILIDADES DO USUÁRIO</h3>
                <p className="mb-3">Você se compromete a:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Utilizar o sistema apenas para fins legais e legítimos</li>
                  <li>Não compartilhar suas credenciais de acesso</li>
                  <li>Manter backups de seus dados importantes</li>
                  <li>Cumprir todas as leis aplicáveis ao usar nossos serviços</li>
                  <li>Não tentar violar a segurança da plataforma</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7. LIMITAÇÃO DE RESPONSABILIDADE</h3>
                <p className="mb-3">
                  O DRIVS não se responsabiliza por:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Perda de dados por falha do usuário em fazer backups</li>
                  <li>Interrupções temporárias do serviço para manutenção</li>
                  <li>Decisões comerciais baseadas nos relatórios da plataforma</li>
                  <li>Problemas decorrentes do uso inadequado do sistema</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">8. SUPORTE TÉCNICO</h3>
                <p className="mb-3">
                  Oferecemos suporte técnico durante horário comercial (8h às 18h, segunda a sexta-feira). 
                  O suporte inclui esclarecimento de dúvidas, orientações de uso e resolução de problemas 
                  técnicos da plataforma.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">9. MODIFICAÇÕES DOS TERMOS</h3>
                <p className="mb-3">
                  Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. 
                  As modificações entrarão em vigor imediatamente após sua publicação na plataforma. 
                  É sua responsabilidade revisar periodicamente estes termos.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">10. CANCELAMENTO</h3>
                <p className="mb-3">
                  Você pode cancelar sua conta a qualquer momento através das configurações da plataforma 
                  ou entrando em contato conosco. O cancelamento não gera direito a reembolso de valores 
                  já pagos, exceto quando previsto em lei.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">11. CONTATO</h3>
                <p className="mb-3">
                  Para dúvidas sobre estes Termos de Uso ou sobre nossos serviços, entre em contato:
                </p>
                <ul className="list-none ml-4 space-y-1">
                  <li><strong>E-mail:</strong> suporte@drivs.com.br</li>
                  <li><strong>Telefone:</strong> 11977263156</li>
                  <li><strong>Horário de atendimento:</strong> Segunda a sexta, 8h às 18h</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">12. LEI APLICÁVEL</h3>
                <p className="mb-3">
                  Estes Termos de Uso são regidos pelas leis brasileiras. Qualquer disputa será 
                  resolvida no foro da comarca onde está localizada a sede da empresa, renunciando 
                  as partes a qualquer outro, por mais privilegiado que seja.
                </p>
              </section>

            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-xs text-white/70">
            © 2025 DRIVS. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}