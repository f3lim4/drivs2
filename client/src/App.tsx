import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VehicleTypesProvider } from "@/contexts/VehicleTypesContext";
import { DrivsLayout } from "@/components/layout/DrivsLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Dashboard from "./pages/Dashboard";
import Motoristas from "./pages/Motoristas";
import Veiculos from "./pages/Veiculos";

import Contratos from "./pages/Contratos";
import Locadoras from "./pages/Locadoras";
import Pagamentos from "./pages/Pagamentos";
import Infracoes from "./pages/Infracoes";
import RelatoriosFinanceiros from "./pages/RelatoriosFinanceiros";
import Manutencoes from "./pages/Manutencoes";
import AnunciosAdmin from "./pages/AnunciosAdmin";
import Planos from "./pages/Planos";
import PlanosLocadora from "./pages/PlanosLocadora";
import PlanosAdmin from "./pages/PlanosAdmin";
import Seo from "./pages/Seo";
import Perfil from "./pages/Perfil";
import Login from "./pages/Login";
import CadastroLocadora from "./pages/CadastroLocadora";
import TermosUso from "./pages/TermosUso";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        let url = queryKey[0] as string;
        
        // Se há parâmetros adicionais na queryKey, adicionar como query parameters
        if (queryKey.length > 1 && queryKey[1]) {
          const locadoraId = queryKey[1] as string;
          url += `?locadoraId=${encodeURIComponent(locadoraId)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      },
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

// Capturar erros não tratados para evitar crashes do sistema
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Capturado unhandledrejection:', event.reason);
    // Prevenir que o erro apareça no console do usuário
    event.preventDefault();
  });
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <VehicleTypesProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro-locadora" element={<CadastroLocadora />} />
            <Route path="/termos-uso" element={<TermosUso />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/site" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={
            <AuthGuard>
              <DrivsLayout><Dashboard /></DrivsLayout>
            </AuthGuard>
          } />
          <Route path="/motoristas" element={
            <AuthGuard>
              <DrivsLayout><Motoristas /></DrivsLayout>
            </AuthGuard>
          } />
          <Route path="/veiculos" element={
            <AuthGuard>
              <DrivsLayout><Veiculos /></DrivsLayout>
            </AuthGuard>
          } />

          <Route path="/contratos" element={
            <AuthGuard>
              <DrivsLayout><Contratos /></DrivsLayout>
            </AuthGuard>
          } />
          <Route path="/locadoras" element={
            <AuthGuard>
              <DrivsLayout><Locadoras /></DrivsLayout>
            </AuthGuard>
          } />
          <Route path="/pagamentos" element={
            <AuthGuard>
              <DrivsLayout><Pagamentos /></DrivsLayout>
            </AuthGuard>
          } />
          <Route path="/infracoes" element={
            <AuthGuard>
              <DrivsLayout><Infracoes /></DrivsLayout>
            </AuthGuard>
          } />
          <Route path="/relatorios-financeiros" element={
            <AuthGuard>
              <DrivsLayout><RelatoriosFinanceiros /></DrivsLayout>
            </AuthGuard>
          } />
          <Route path="/manutencoes" element={
            <AuthGuard>
              <DrivsLayout><Manutencoes /></DrivsLayout>
            </AuthGuard>
          } />
          <Route path="/anuncios" element={
            <AuthGuard>
              <DrivsLayout><AnunciosAdmin /></DrivsLayout>
            </AuthGuard>
          } />
          <Route path="/planos" element={
            <AuthGuard>
              <DrivsLayout><PlanosLocadora /></DrivsLayout>
            </AuthGuard>
          } />
          <Route path="/seo" element={
            <AuthGuard>
              <DrivsLayout><Seo /></DrivsLayout>
            </AuthGuard>
          } />
          <Route path="/admin/planos" element={
            <AuthGuard>
              <DrivsLayout><PlanosAdmin /></DrivsLayout>
            </AuthGuard>
          } />
          <Route path="/perfil" element={
            <AuthGuard>
              <DrivsLayout><Perfil /></DrivsLayout>
            </AuthGuard>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </VehicleTypesProvider>
  </QueryClientProvider>
);

export default App;
