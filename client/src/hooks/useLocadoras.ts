/**
 * Custom hook for managing Locadoras data and operations
 */

import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Locadora } from '@/types/locadora';

export const useLocadoras = () => {
  const [locadoras, setLocadoras] = useState<Locadora[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocadoras = async () => {
    try {
      const { data, error } = await supabase
        .from('locadoras')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocadoras(data as Locadora[] || []);
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
      console.log('Tentando excluir locadora com ID:', id);
      
      // Verificar se está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Usuário logado:', user?.email);
      
      const { error } = await supabase
        .from('locadoras')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro na exclusão:', error);
        throw error;
      }

      console.log('Locadora excluída com sucesso');
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