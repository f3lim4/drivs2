
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="relative hidden md:flex w-64">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
