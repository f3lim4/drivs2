/**
 * Search component for Locadoras page
 */

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader } from '@/components/ui/card';

interface LocadorasSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function LocadorasSearch({ searchTerm, onSearchChange }: LocadorasSearchProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ, cidade..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
    </Card>
  );
}