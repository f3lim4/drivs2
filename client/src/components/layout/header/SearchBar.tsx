
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="relative hidden md:flex w-64">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 flex items-center justify-center">
        <Search className="w-full h-full" />
      </div>
      <Input
        type="search"
        placeholder="Pesquisar..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 pr-4"
      />
    </div>
  );
}
