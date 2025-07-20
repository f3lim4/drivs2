import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export type VehicleType = 'carro' | 'moto' | 'caminhao' | 'utilitario';

interface VehicleTypesContextType {
  vehicleTypes: VehicleType[]; // Para compatibilidade
  selectedTypes: VehicleType[];
  setSelectedTypes: (types: VehicleType[]) => void;
  updateVehicleTypes: (types: VehicleType[]) => Promise<void>;
  isLoading: boolean;
}

const VehicleTypesContext = createContext<VehicleTypesContextType | undefined>(undefined);

export function VehicleTypesProvider({ children }: { children: React.ReactNode }) {
  const [selectedTypes, setSelectedTypes] = useState<VehicleType[]>(['carro']);
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Carregar tipos de veículos da locadora
  const { data: locadoraData, isLoading, refetch } = useQuery({
    queryKey: ['/api/locadoras', profile?.locadoraId],
    enabled: !!profile?.locadoraId && profile?.type === 'locadora',
    staleTime: 0, // Sempre buscar dados atualizados
    refetchOnWindowFocus: true, // Recarregar quando voltar ao foco
    refetchOnMount: true, // Sempre refetch ao montar
  });

  // Atualizar estado quando dados da locadora carregarem
  useEffect(() => {
    if (locadoraData?.tiposVeiculos) {
      setSelectedTypes(locadoraData.tiposVeiculos);
    }
  }, [locadoraData]);

  // Escutar mudanças no localStorage para invalidar cache
  useEffect(() => {
    const handleStorageChange = () => {
      if (profile?.locadoraId) {
        queryClient.invalidateQueries({
          queryKey: ['/api/locadoras', profile.locadoraId],
        });
        refetch();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event listener para mudanças internas
    const handleProfileUpdate = () => {
      if (profile?.locadoraId) {
        queryClient.invalidateQueries({
          queryKey: ['/api/locadoras', profile.locadoraId],
        });
        setTimeout(() => refetch(), 100);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [profile?.locadoraId, queryClient, refetch]);

  // Função para atualizar tipos de veículos no backend
  const updateVehicleTypes = async (types: VehicleType[]) => {
    if (!profile?.locadoraId) return;

    try {
      const response = await fetch(`/api/locadoras/${profile.locadoraId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tiposVeiculos: types,
        }),
      });

      if (response.ok) {
        console.log('VehicleTypesContext - Tipos atualizados no backend:', types);
        setSelectedTypes(types);
        
        // Invalidar cache para forçar reload dos dados
        queryClient.invalidateQueries({
          queryKey: ['/api/locadoras', profile.locadoraId],
        });
        
        // Forçar uma recarga dos dados
        setTimeout(() => {
          refetch();
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao atualizar tipos de veículos:', error);
    }
  };

  return (
    <VehicleTypesContext.Provider value={{
      vehicleTypes: selectedTypes, // Exportar como vehicleTypes para compatibilidade
      selectedTypes,
      setSelectedTypes,
      updateVehicleTypes,
      isLoading
    }}>
      {children}
    </VehicleTypesContext.Provider>
  );
}

export function useVehicleTypes() {
  const context = useContext(VehicleTypesContext);
  if (context === undefined) {
    throw new Error('useVehicleTypes deve ser usado dentro de VehicleTypesProvider');
  }
  return context;
}