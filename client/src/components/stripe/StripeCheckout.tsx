import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  clientSecret: string;
  subscriptionId: string;
  planoNome: string;
  valor: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ clientSecret, subscriptionId, planoNome, valor, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [tipoPlano, setTipoPlano] = React.useState<'mensal' | 'anual'>('mensal');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setLoading(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        toast({
          title: "Erro no pagamento",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: "Pagamento realizado!",
          description: `Plano ${planoNome} ativado com sucesso.`,
        });
        onSuccess();
      }
    } catch (err) {
      console.error('Erro no checkout:', err);
      toast({
        title: "Erro no pagamento",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Finalizar Pagamento
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            <p>Plano: <span className="font-semibold">{planoNome}</span></p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seleção do tipo de plano */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Escolha o período:</Label>
              <RadioGroup 
                value={tipoPlano} 
                onValueChange={(value: 'mensal' | 'anual') => setTipoPlano(value)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50">
                  <RadioGroupItem value="mensal" id="mensal" />
                  <Label htmlFor="mensal" className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span>Mensal</span>
                      <span className="font-semibold">R$ {valor}/mês</span>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50">
                  <RadioGroupItem value="anual" id="anual" />
                  <Label htmlFor="anual" className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span>Anual (2 meses grátis)</span>
                      <div className="text-right">
                        <span className="font-semibold">R$ {Math.round(valor * 10)}/ano</span>
                        <div className="text-xs text-green-600">Economize R$ {Math.round(valor * 2)}</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="p-3 border rounded-md">
              <CardElement 
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: 'hsl(var(--foreground))',
                      '::placeholder': {
                        color: 'hsl(var(--muted-foreground))',
                      },
                    },
                  },
                }}
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                disabled={!stripe || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  tipoPlano === 'anual' 
                    ? `Pagar R$ ${Math.round(valor * 10)} (anual)`
                    : `Pagar R$ ${valor} (mensal)`
                )}
              </Button>
            </div>
          </form>
          
          <div className="mt-4 text-xs text-muted-foreground text-center">
            <p>Pagamento seguro processado pelo Stripe</p>
            <p>Seus dados de cartão são criptografados</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StripeCheckoutProps {
  clientSecret: string;
  subscriptionId: string;
  planoNome: string;
  valor: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StripeCheckout(props: StripeCheckoutProps) {
  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Erro: Chave pública do Stripe não configurada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
}