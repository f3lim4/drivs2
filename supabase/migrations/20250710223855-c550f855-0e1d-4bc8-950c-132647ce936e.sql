-- Confirmar o email do usuário admin existente
UPDATE auth.users 
SET 
  email_confirmed_at = now(),
  updated_at = now()
WHERE email = 'drivs@drivs.com.br';

-- Garantir que o perfil admin existe
INSERT INTO public.profiles (user_id, email, name, type)
SELECT id, 'drivs@drivs.com.br', 'Admin DRIVS', 'admin'
FROM auth.users 
WHERE email = 'drivs@drivs.com.br'
ON CONFLICT (email) DO NOTHING;