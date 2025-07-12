import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DrivsLayout } from "@/components/layout/DrivsLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Dashboard from "./pages/Dashboard";
import Motoristas from "./pages/Motoristas";
import Veiculos from "./pages/Veiculos";
import Alugueis from "./pages/Alugueis";
import Contratos from "./pages/Contratos";
import Locadoras from "./pages/Locadoras";
import Perfil from "./pages/Perfil";
import Login from "./pages/Login";
import CadastroLocadora from "./pages/CadastroLocadora";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const response = await fetch(queryKey[0] as string);
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro-locadora" element={<CadastroLocadora />} />
          <Route path="/" element={
            <AuthGuard>
              <DrivsLayout><Dashboard /></DrivsLayout>
            </AuthGuard>
          } />
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
          <Route path="/alugueis" element={
            <AuthGuard>
              <DrivsLayout><Alugueis /></DrivsLayout>
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
  </QueryClientProvider>
);

export default App;
