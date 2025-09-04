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
        
        // Validar se o profile tem dados essenciais
        if (!profile || !profile.email || (!profile.locadoraId && !profile.id)) {
          console.warn('Profile corrompido detectado, redirecionando para logout de emergência');
          localStorage.removeItem('drivs_profile');
          setProfile(null);
          // Redirecionar para página de emergência
          window.location.href = '/emergency-logout';
          return;
        } else {
          setProfile(profile);
        }
      } catch (error) {
        console.error('Error parsing saved profile:', error);
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
    // Força reload da página para limpar cache
    window.location.reload();
  };

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