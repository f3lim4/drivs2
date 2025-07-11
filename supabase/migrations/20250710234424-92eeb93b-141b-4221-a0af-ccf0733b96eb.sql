-- Criar política para permitir inserção pública de locadoras
-- (para a página de cadastro público)
CREATE POLICY "locadoras_insert_public" 
ON public.locadoras 
FOR INSERT 
WITH CHECK (true);

-- Comentário: Esta política permite que qualquer pessoa insira uma nova locadora
-- através da página de cadastro público. As locadoras entram com status 'ativa'
-- por padrão conforme configurado no código.