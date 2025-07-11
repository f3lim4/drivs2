-- Criar tabela de veículos
CREATE TABLE public.veiculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  locadora_id UUID NOT NULL REFERENCES public.locadoras(id) ON DELETE CASCADE,
  
  -- Informações Básicas
  placa TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  cor TEXT NOT NULL,
  categoria TEXT NOT NULL,
  
  -- Documentação
  renavam TEXT NOT NULL,
  chassi TEXT NOT NULL,
  
  -- Características Técnicas
  combustivel TEXT NOT NULL,
  quilometragem INTEGER NOT NULL DEFAULT 0,
  valor_semanal DECIMAL(10,2) NOT NULL,
  caucao DECIMAL(10,2) NOT NULL,
  taxa_administrativa DECIMAL(10,2),
  limite_quilometragem TEXT NOT NULL,
  valor_limite_km INTEGER,
  
  -- Manutenção
  ultima_revisao DATE,
  proxima_revisao DATE,
  
  -- Seguro
  seguradora TEXT,
  numero_apolice TEXT,
  vigencia_seguro DATE,
  valor_seguro_mensal DECIMAL(10,2),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'alugado', 'manutencao', 'indisponivel')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(placa),
  UNIQUE(renavam),
  UNIQUE(chassi)
);

-- Habilitar RLS
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para veículos
-- Locadoras só podem ver e gerenciar seus próprios veículos
CREATE POLICY "Locadoras podem ver seus próprios veículos" 
ON public.veiculos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.type = 'locadora'
    AND profiles.locadora_id = veiculos.locadora_id
  )
);

CREATE POLICY "Locadoras podem criar veículos para sua empresa" 
ON public.veiculos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.type = 'locadora'
    AND profiles.locadora_id = veiculos.locadora_id
  )
);

CREATE POLICY "Locadoras podem atualizar seus próprios veículos" 
ON public.veiculos 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.type = 'locadora'
    AND profiles.locadora_id = veiculos.locadora_id
  )
);

CREATE POLICY "Locadoras podem excluir seus próprios veículos" 
ON public.veiculos 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.type = 'locadora'
    AND profiles.locadora_id = veiculos.locadora_id
  )
);

-- Admins podem ver todos os veículos
CREATE POLICY "Admins podem ver todos os veículos" 
ON public.veiculos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.type = 'admin'
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_veiculos_updated_at
BEFORE UPDATE ON public.veiculos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();