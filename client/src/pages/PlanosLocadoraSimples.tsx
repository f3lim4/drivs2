import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Car, Rocket, Zap, Crown, Infinity, Star } from "lucide-react";

const PlanosLocadoraSimples = () => {
  const [solicitando, setSolicitando] = useState(false);

  const handleSolicitarMudanca = async (plano: string) => {
    setSolicitando(true);
    // Lógica de mudança de plano aqui
    setTimeout(() => setSolicitando(false), 2000);
  };

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Planos Disponíveis</h1>
        <p className="text-muted-foreground">
          Escolha o plano ideal para sua locadora
        </p>
      </div>
      
      {/* Grid de Planos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Plano Start */}
        <Card className="h-full">
          <CardHeader className="text-center pb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full flex items-center justify-center bg-blue-500">
              <Car className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <CardTitle className="text-lg sm:text-xl">Start</CardTitle>
            <CardDescription className="text-base sm:text-lg font-semibold">
              R$ 50,00/mês
            </CardDescription>
            <p className="text-xs text-muted-foreground leading-tight">Para locadoras iniciantes</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Até 5 veículos na frota</span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Gestão completa de motoristas</span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Contratos automáticos</span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Controle de pagamentos</span>
              </div>
            </div>
            <div className="pt-3">
              <Button
                onClick={() => handleSolicitarMudanca('start')}
                disabled={solicitando}
                className="w-full text-sm sm:text-base"
                variant="outline"
              >
                {solicitando ? "Processando..." : "Mudar Plano"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Plano Pro */}
        <Card className="h-full ring-2 ring-cyan-500 relative">
          <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-white z-10">
            Mais Popular
          </Badge>
          <CardHeader className="text-center pb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full flex items-center justify-center bg-cyan-500">
              <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <CardTitle className="text-lg sm:text-xl">Pro</CardTitle>
            <CardDescription className="text-base sm:text-lg font-semibold">
              R$ 99,00/mês
            </CardDescription>
            <p className="text-xs text-muted-foreground leading-tight">Para locadoras em crescimento</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Até 20 veículos na frota</span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Gestão completa de motoristas</span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Contratos automáticos</span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Controle de pagamentos</span>
              </div>
            </div>
            <div className="pt-3">
              <Button
                onClick={() => handleSolicitarMudanca('pro')}
                disabled={solicitando}
                className="w-full text-sm sm:text-base"
              >
                {solicitando ? "Processando..." : "Mudar Plano"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Plano Elite */}
        <Card className="h-full">
          <CardHeader className="text-center pb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full flex items-center justify-center bg-green-500">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <CardTitle className="text-lg sm:text-xl">Elite</CardTitle>
            <CardDescription className="text-base sm:text-lg font-semibold">
              R$ 250,00/mês
            </CardDescription>
            <p className="text-xs text-muted-foreground leading-tight">Para frotas médias</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Até 50 veículos na frota</span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Gestão completa de motoristas</span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Contratos automáticos</span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Controle de pagamentos</span>
              </div>
            </div>
            <div className="pt-3">
              <Button
                onClick={() => handleSolicitarMudanca('elite')}
                disabled={solicitando}
                className="w-full text-sm sm:text-base"
                variant="outline"
              >
                {solicitando ? "Processando..." : "Mudar Plano"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Plano Prime */}
        <Card className="h-full">
          <CardHeader className="text-center pb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full flex items-center justify-center bg-purple-500">
              <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <CardTitle className="text-lg sm:text-xl">Prime</CardTitle>
            <CardDescription className="text-base sm:text-lg font-semibold">
              R$ 500,00/mês
            </CardDescription>
            <p className="text-xs text-muted-foreground leading-tight">Para grandes frotas</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Até 100 veículos na frota</span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Suporte por telefone</span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Contratos automáticos</span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Controle de pagamentos</span>
              </div>
            </div>
            <div className="pt-3">
              <Button
                onClick={() => handleSolicitarMudanca('prime')}
                disabled={solicitando}
                className="w-full text-sm sm:text-base"
                variant="outline"
              >
                {solicitando ? "Processando..." : "Mudar Plano"}
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl md:text-2xl">Todos os planos incluem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-3 md:space-y-4">
              <h4 className="font-semibold text-base">Recursos básicos:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Sistema completo de gerenciamento</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Controle financeiro com lucros/perdas reais</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Contratos automáticos profissionais</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Suporte por email</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3 md:space-y-4">
              <h4 className="font-semibold text-base">Diferenciais Premium:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <span>Prime: Suporte por telefone + 100 veículos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-pink-500 flex-shrink-0" />
                  <span>Todos os planos com atualizações automáticas</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanosLocadoraSimples;