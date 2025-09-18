/**
 * Hook para gerenciar autenticação e tipo de usuário
 */

import { useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  userId: string;
  email: string;
  name: string;
  type: 'admin' | 'locadora';
  locadoraId?: string;
}

export function useAuth() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage  
    const savedProfile = localStorage.getItem('drivs_profile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        // Validação básica para evitar loops
        if (profile && profile.email && profile.type && (profile.id || profile.userId)) {
          setProfile(profile);
          
          // ✅ RESTAURAR SESSÃO NO SERVIDOR - para compatibilidade com APIs autenticadas
          fetch(`/api/auth/profile?email=${encodeURIComponent(profile.email)}`, {
            credentials: 'include', // ✅ Garantir que cookies sejam enviados e recebidos
            cache: 'no-store'       // ✅ Evitar 304 que pode pular Set-Cookie
          })
            .then(response => {
              if (response.ok) {
                console.log('✅ Sessão restaurada no servidor para:', profile.email);
              } else {
                console.warn('❌ Falha ao restaurar sessão no servidor:', response.status);
                // 🔒 SECURITY FIX: Se sessão está quebrada (401), limpar localStorage e forçar login
                if (response.status === 401) {
                  console.log('🔧 Sessão inválida detectada, limpando dados locais...');
                  localStorage.removeItem('drivs_profile');
                  setProfile(null); // Isso vai triggerar o AuthGuard para redirecionar para login
                }
              }
            })
            .catch(error => {
              console.warn('❌ Erro ao restaurar sessão no servidor:', error);
              // Em caso de erro de rede, também limpar para forçar novo login
              console.log('🔧 Erro de rede, limpando dados locais para segurança...');
              localStorage.removeItem('drivs_profile');
              setProfile(null);
            });
        } else {
          // Profile inválido, remove mas não redireciona
          console.log('Profile inválido removido do localStorage');
          localStorage.removeItem('drivs_profile');
        }
      } catch (error) {
        // Se erro no parse, apenas remove e continua
        console.log('Erro ao fazer parse do profile, removendo');
        localStorage.removeItem('drivs_profile');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      setProfile(data.profile);
      localStorage.setItem('drivs_profile', JSON.stringify(data.profile));
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, type: string, locadoraData?: any) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, type, locadoraData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      setProfile(data.profile);
      localStorage.setItem('drivs_profile', JSON.stringify(data.profile));
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    setProfile(null);
    localStorage.removeItem('drivs_profile');
    // Logout simples sem forçar reload
  };

  // Sistema simplificado: tem conta = entra, não tem conta = não entra
  // Removida verificação periódica que causava logout forçado

  const isAdmin = profile?.type === 'admin';
  const isLocadora = profile?.type === 'locadora';

  return {
    profile,
    isAdmin,
    isLocadora,
    isLoading,
    isAuthenticated: !!profile,
    login,
    register,
    logout
  };
}