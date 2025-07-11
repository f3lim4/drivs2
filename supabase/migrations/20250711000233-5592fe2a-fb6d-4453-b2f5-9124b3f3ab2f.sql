-- Limpar dados duplicados e adicionar constraints de unicidade

-- 1. Primeiro, deletar registros duplicados mantendo apenas o mais recente
DELETE FROM public.locadoras 
WHERE id NOT IN (
    SELECT DISTINCT ON (telefone) id 
    FROM public.locadoras 
    ORDER BY telefone, created_at DESC
);

-- 2. Também verificar e limpar possíveis duplicados de email e CNPJ
DELETE FROM public.locadoras 
WHERE id NOT IN (
    SELECT DISTINCT ON (email) id 
    FROM public.locadoras 
    ORDER BY email, created_at DESC
);

DELETE FROM public.locadoras 
WHERE id NOT IN (
    SELECT DISTINCT ON (cnpj) id 
    FROM public.locadoras 
    ORDER BY cnpj, created_at DESC
);

-- 3. Agora adicionar as constraints de unicidade
ALTER TABLE public.locadoras 
ADD CONSTRAINT locadoras_cnpj_unique UNIQUE (cnpj);

ALTER TABLE public.locadoras 
ADD CONSTRAINT locadoras_email_unique UNIQUE (email);

ALTER TABLE public.locadoras 
ADD CONSTRAINT locadoras_telefone_unique UNIQUE (telefone);