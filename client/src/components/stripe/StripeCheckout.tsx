/**
 * Componente de Checkout Stripe para mudança de planos
 */

import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StripeCheckoutProps {
  plano: string;
  preco: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StripeCheckout({ plano, preco, onSuccess, onCancel }: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/planos?success=true`,
        },
      });

      if (error) {
        toast({
          title: "Erro no pagamento",
          description: error.message || "Ocorreu um erro ao processar o pagamento.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Pagamento processado!",
          description: `Plano ${plano} ativado com sucesso.`,
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          Confirmar mudança de plano
        </CardTitle>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            R$ {preco.toFixed(2)}/mês
          </p>
          <p className="text-sm text-muted-foreground">
            Plano {plano}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Processando...
                </>
              ) : (
                'Confirmar pagamento'
              )}
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Seus dados são protegidos pelo Stripe. Pagamento seguro com SSL.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}