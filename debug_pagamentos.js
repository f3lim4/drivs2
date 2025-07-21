console.log("🔍 FORÇANDO INVALIDAÇÃO DE CACHE DOS PAGAMENTOS");

// Encontra a instância do React Query Client
const reactQueryClient = window.__REACT_QUERY_CLIENT__;
if (reactQueryClient) {
  console.log("✅ React Query Client encontrado");
  
  // Invalida TODAS as queries de pagamentos
  reactQueryClient.invalidateQueries();
  reactQueryClient.removeQueries();
  
  console.log("🔄 Cache completamente limpo");
} else {
  console.log("❌ React Query Client não encontrado");
}

// Força refresh da página de pagamentos
if (window.location.pathname.includes('pagamentos')) {
  setTimeout(() => {
    console.log("🔄 Refreshing página...");
    window.location.reload();
  }, 1000);
}