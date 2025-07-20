import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export type VehicleType = 'carro' | 'moto' | 'caminhao' | 'utilitario';

interface VehicleTypesContextType {
  selectedTypes: VehicleType[];
  setSelectedTypes: (types: VehicleType[]) => void;
  updateVehicleTypes: (types: VehicleType[]) => Promise<void>;
  isLoading: boolean;
}

const VehicleTypesContext = createContext<VehicleTypesContextType | undefined>(undefined);

export function VehicleTypesProvider({ children }: { children: React.ReactNode }) {
  const [selectedTypes, setSelectedTypes] = useState<VehicleType[]>(['carro']);
  const { profile } = useAuth();

  // Carregar tipos de veículos da locadora
  const { data: locadoraData, isLoading } = useQuery({
    queryKey: ['/api/locadoras', profile?.locadoraId],
    enabled: !!profile?.locadoraId && profile?.type === 'locadora',
    staleTime: 0, // Sempre buscar dados atualizados
    refetchOnWindowFocus: true, // Recarregar quando voltar ao foco
  });

  // Atualizar estado quando dados da locadora carregarem
  useEffect(() => {
    if (locadoraData?.tiposVeiculos) {
      setSelectedTypes(locadoraData.tiposVeiculos);
    }
  }, [locadoraData]);

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
        setSelectedTypes(types);
      }
    } catch (error) {
      console.error('Erro ao atualizar tipos de veículos:', error);
    }
  };

  return (
    <VehicleTypesContext.Provider value={{
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