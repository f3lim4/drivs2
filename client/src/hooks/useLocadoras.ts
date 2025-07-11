/**
 * Custom hook for managing Locadoras data and operations
 */

import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Locadora } from '@/types';

export const useLocadoras = () => {
  const [locadoras, setLocadoras] = useState<Locadora[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocadoras = async () => {
    try {
      const response = await fetch('/api/locadoras');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar locadoras');
      }
      
      const data = await response.json();
      setLocadoras(data || []);
    } catch (error) {
      console.error('Erro ao carregar locadoras:', error);
      toast({
        title: "Erro ao carregar locadoras",
        description: "Não foi possível carregar a lista de locadoras",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLocadora = async (id: string) => {
    try {
      const response = await fetch(`/api/locadoras/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir locadora');
      }

      setLocadoras(prev => prev.filter(l => l.id !== id));
      
      toast({
        title: "Locadora excluída",
        description: "A locadora foi removida com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir locadora:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a locadora",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLocadoras();
  }, []);

  return {
    locadoras,
    isLoading,
    fetchLocadoras,
    deleteLocadora,
  };
};