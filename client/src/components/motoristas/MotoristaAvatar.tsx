import { useState, useEffect } from 'react';

interface MotoristaAvatarProps {
  motoristaId: string;
  nome: string;
  className?: string;
}

export function MotoristaAvatar({ motoristaId, nome, className = "w-10 h-10" }: MotoristaAvatarProps) {
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const response = await fetch(`/api/motoristas/${motoristaId}/imagens`);
        if (response.ok) {
          const data = await response.json();
          const fotoPerfilUrl = data.documentos?.fotoPerfil;
          if (fotoPerfilUrl) {
            setFotoPerfil(fotoPerfilUrl);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar foto de perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileImage();
  }, [motoristaId]);

  if (loading) {
    return (
      <div className={`${className} bg-gray-200 rounded-full flex items-center justify-center animate-pulse`}>
        <span className="text-gray-400 font-medium text-sm">
          {nome.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} bg-primary rounded-full flex items-center justify-center overflow-hidden`}>
      {fotoPerfil ? (
        <>
          <img 
            src={fotoPerfil} 
            alt={nome}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Se a imagem não carregar, mostra as iniciais
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.style.display = 'flex';
              }
            }}
          />
          <span 
            className="text-primary-foreground font-medium text-sm w-full h-full flex items-center justify-center"
            style={{ display: 'none' }}
          >
            {nome.charAt(0).toUpperCase()}
          </span>
        </>
      ) : (
        <span className="text-primary-foreground font-medium text-sm">
          {nome.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}