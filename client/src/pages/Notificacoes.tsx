/**
 * Página de Notificações
 * Mostra todas as notificações da locadora com opções de filtro e visualização
 */

import { useState } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Notificacoes() {
  const { notifications, unreadCount, hasNotifications } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'danger':
        return 'border-l-destructive bg-destructive/5';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-l-blue-500 bg-blue-50';
      case 'success':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-muted bg-muted/5';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'danger':
        return 'Crítico';
      case 'warning':
        return 'Aviso';
      case 'info':
        return 'Informação';
      case 'success':
        return 'Sucesso';
      default:
        return 'Outros';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'danger':
        return 'destructive' as const;
      case 'warning':
        return 'secondary' as const;
      case 'info':
        return 'outline' as const;
      case 'success':
        return 'default' as const;
      default:
        return 'secondary' as const;
    }
  };

  // Filtrar notificações
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Contar notificações por tipo
  const typeCounts = notifications.reduce((acc, notification) => {
    acc[notification.type] = (acc[notification.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="w-8 h-8" />
            Notificações
          </h1>
          <p className="text-gray-600 mt-1">
            {hasNotifications ? (
              <>Você tem {notifications.length} notificações{unreadCount > 0 && `, ${unreadCount} não lidas`}</>
            ) : (
              'Nenhuma notificação no momento'
            )}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {unreadCount} não lidas
          </Badge>
        )}
      </div>

      {/* Filtros e Busca */}
      {hasNotifications && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por título ou mensagem..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filtro por tipo */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos ({notifications.length})</SelectItem>
                  <SelectItem value="danger">Crítico ({typeCounts.danger || 0})</SelectItem>
                  <SelectItem value="warning">Aviso ({typeCounts.warning || 0})</SelectItem>
                  <SelectItem value="info">Informação ({typeCounts.info || 0})</SelectItem>
                  <SelectItem value="success">Sucesso ({typeCounts.success || 0})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Notificações */}
      <div className="space-y-4">
        {!hasNotifications ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma notificação</h3>
              <p className="text-gray-600 text-center max-w-md">
                Tudo em dia com CNHs, multas e pagamentos! 
                Quando houver alertas importantes, eles aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum resultado encontrado</h3>
              <p className="text-gray-600 text-center">
                Tente ajustar os filtros ou termo de busca para encontrar as notificações desejadas.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
              >
                Limpar filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification, index) => (
            <Card 
              key={notification.id} 
              className={`border-l-4 ${getNotificationColor(notification.type)} transition-all hover:shadow-md`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Ícone */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={getTypeBadgeVariant(notification.type)}>
                          {getTypeLabel(notification.type)}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {formatDistanceToNow(notification.timestamp, { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                      <span>
                        {format(notification.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Footer com resumo */}
      {hasNotifications && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="text-center text-sm text-gray-600">
              Mostrando {filteredNotifications.length} de {notifications.length} notificações
              {searchTerm && ` para "${searchTerm}"`}
              {filterType !== 'all' && ` do tipo "${getTypeLabel(filterType)}"`}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}