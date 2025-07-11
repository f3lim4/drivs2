-- Criar tabela para locadoras
CREATE TABLE public.locadoras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  endereco TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  cep TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('ativa', 'inativa', 'pendente')),
  plano TEXT NOT NULL DEFAULT 'basico' CHECK (plano IN ('basico', 'premium', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.locadoras ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso (apenas admins podem gerenciar locadoras)
CREATE POLICY "locadoras_select_all" 
ON public.locadoras 
FOR SELECT 
USING (true); -- Qualquer usuário logado pode ver

CREATE POLICY "locadoras_insert_admin" 
ON public.locadoras 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND type = 'admin'
));

CREATE POLICY "locadoras_update_admin" 
ON public.locadoras 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND type = 'admin'
));

CREATE POLICY "locadoras_delete_admin" 
ON public.locadoras 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND type = 'admin'
));

-- Criar trigger para updated_at
CREATE TRIGGER update_locadoras_updated_at
BEFORE UPDATE ON public.locadoras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados de exemplo
INSERT INTO public.locadoras (nome, razao_social, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel, status, plano) VALUES
('AutoRent Premium', 'AutoRent Premium Locadora Ltda', '12.345.678/0001-90', 'contato@autorent.com', '(11) 98765-4321', 'Av. Paulista, 1000', 'São Paulo', 'SP', '01310-100', 'João Silva', 'ativa', 'premium'),
('CarLoc Express', 'CarLoc Express Aluguel de Veículos Ltda', '98.765.432/0001-10', 'admin@carloc.com.br', '(21) 99887-6655', 'Rua Copacabana, 500', 'Rio de Janeiro', 'RJ', '22070-001', 'Maria Santos', 'ativa', 'enterprise'),
('MoveRent', 'MoveRent Locação de Automóveis ME', '55.444.333/0001-22', 'contato@moverent.com', '(31) 91234-5678', 'Av. Afonso Pena, 1500', 'Belo Horizonte', 'MG', '30130-002', 'Carlos Oliveira', 'pendente', 'basico');