import { Car, Bike, Truck, Bus } from 'lucide-react';
import { useVehicleTypes } from '@/contexts/VehicleTypesContext';
import { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ className = '', size = 'md' }: LoadingSpinnerProps) {
  const { selectedTypes } = useVehicleTypes();
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  // Mapeia tipos para ícones
  const iconMap = {
    carro: Car,
    moto: Bike,
    caminhao: Truck,
    utilitario: Bus
  };

  // Cria array de ícones baseado nos tipos selecionados
  const availableIcons = selectedTypes.length > 0 
    ? selectedTypes.map(type => iconMap[type])
    : [Car]; // Fallback para carro se não houver tipos

  // Alterna ícones a cada 1 segundo se há múltiplos tipos
  useEffect(() => {
    if (availableIcons.length > 1) {
      const interval = setInterval(() => {
        setCurrentIconIndex((prev) => (prev + 1) % availableIcons.length);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [availableIcons.length]);

  const CurrentIcon = availableIcons[currentIconIndex] || Car;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} text-blue-600 animate-bounce transition-all duration-300`}>
          <CurrentIcon className="w-full h-full" />
        </div>
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gray-300 rounded-full opacity-50 animate-pulse"></div>
      </div>
    </div>
  );
}