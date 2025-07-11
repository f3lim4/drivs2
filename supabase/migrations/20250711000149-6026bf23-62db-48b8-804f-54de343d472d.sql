-- Adicionar constraints de unicidade para CNPJ, email e telefone
-- Evita duplicação desses dados críticos no sistema

-- Primeiro, vamos verificar se já existem dados duplicados (opcional, mas seguro)
-- Se houver duplicados, a constraint falhará e será necessário limpar primeiro

-- Adicionar constraint de unicidade para CNPJ
ALTER TABLE public.locadoras 
ADD CONSTRAINT locadoras_cnpj_unique UNIQUE (cnpj);

-- Adicionar constraint de unicidade para email  
ALTER TABLE public.locadoras 
ADD CONSTRAINT locadoras_email_unique UNIQUE (email);

-- Adicionar constraint de unicidade para telefone
ALTER TABLE public.locadoras 
ADD CONSTRAINT locadoras_telefone_unique UNIQUE (telefone);

-- Comentário: Essas constraints garantem que não haverá duplicação de:
-- - CNPJ: Documento único por empresa
-- - Email: Cada email só pode ser usado por uma locadora  
-- - Telefone: Cada telefone só pode estar associado a uma locadora