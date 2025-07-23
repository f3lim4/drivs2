import { useState, useEffect } from 'react';
import { Car, Bike, Truck, Bus } from 'lucide-react';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ className = '', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  // Array com os diferentes tipos de veículos - TODOS AZUIS
  const vehicleTypes = [
    { icon: Car, color: 'text-blue-600' },
    { icon: Bike, color: 'text-blue-600' },
    { icon: Truck, color: 'text-blue-600' },
    { icon: Bus, color: 'text-blue-600' }
  ];

  const [currentVehicleIndex, setCurrentVehicleIndex] = useState(0);

  // Alterna entre os diferentes tipos de veículos a cada 800ms
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVehicleIndex((prev) => (prev + 1) % vehicleTypes.length);
    }, 800);

    return () => clearInterval(interval);
  }, [vehicleTypes.length]);

  const CurrentIcon = vehicleTypes[currentVehicleIndex].icon;
  const currentColor = vehicleTypes[currentVehicleIndex].color;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} ${currentColor} animate-bounce transition-colors duration-300`}>
          <CurrentIcon className="w-full h-full" />
        </div>
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gray-300 rounded-full opacity-50 animate-pulse"></div>
      </div>
    </div>
  );
}