import { AlertTriangle, CreditCard, Calendar, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface SubscriptionBlockProps {
  status: 'expired' | 'pending';
  expiresAt?: Date;
  companyName?: string;
}

export function SubscriptionBlock({ status, expiresAt, companyName }: SubscriptionBlockProps) {
  const [, setLocation] = useLocation();

  const handleGoToPlans = () => {
    setLocation('/planos');
  };

  const handleGoToPayment = () => {
    setLocation('/planos');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-destructive/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <Lock className="h-10 w-10 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-destructive">
              {status === 'expired' ? 'Plano Expirado' : 'Pagamento Pendente'}
            </CardTitle>
            <CardDescription className="text-lg">
              {companyName && (
                <span className="font-medium">{companyName}</span>
              )}
            </CardDescription>
          </div>

          <Badge variant="destructive" className="text-base px-4 py-2">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Acesso Bloqueado
          </Badge>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">
                  {status === 'expired' 
                    ? 'Seu período de acesso ao DRIVS expirou'
                    : 'Há um pagamento pendente em sua conta'
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {status === 'expired'
                    ? 'Para continuar utilizando o sistema de gestão de locadora, é necessário renovar seu plano.'
                    : 'Para manter o acesso ao sistema, é necessário regularizar o pagamento.'
                  }
                </p>
              </div>
            </div>

            {expiresAt && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    Data de expiração: {new Date(expiresAt).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Renove agora para não perder seus dados e configurações.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">
                  Acesso às funcionalidades bloqueado
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Dashboard, cadastros, relatórios e todas as demais funcionalidades estão temporariamente indisponíveis.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Button 
              onClick={handleGoToPlans}
              className="w-full h-14 text-base"
              size="lg"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Ver Planos
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <Button 
              onClick={handleGoToPayment}
              variant="outline"
              className="w-full h-14 text-base"
              size="lg"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Efetuar Pagamento
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Precisa de ajuda? Entre em contato conosco pelo 
              <span className="font-medium text-foreground"> suporte@drivs.com.br</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}