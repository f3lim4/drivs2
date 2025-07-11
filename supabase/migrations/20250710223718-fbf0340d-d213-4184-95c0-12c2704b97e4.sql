-- Criar usuário admin diretamente no banco de dados
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'drivs@drivs.com.br',
  crypt('Fbl@4510', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin DRIVS"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Inserir o perfil admin correspondente
INSERT INTO public.profiles (user_id, email, name, type)
SELECT id, 'drivs@drivs.com.br', 'Admin DRIVS', 'admin'
FROM auth.users 
WHERE email = 'drivs@drivs.com.br'
ON CONFLICT (email) DO NOTHING;