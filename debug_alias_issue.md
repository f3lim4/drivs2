# Debug: Problema do "alias" nos registros

## Investigação realizada:

### 1. Verificação do banco de dados
- ✅ Verificado tabela `motoristas` - nenhum registro com "alias"
- ✅ Verificado tabela `veiculos` - nenhum registro com "alias"  
- ✅ Verificado tabela `locadoras` - nenhum registro com "alias"
- ✅ Verificado tabela `profiles` - nenhum registro com "alias"
- ✅ Verificado tabela `users` - nenhum registro com "alias"

### 2. Verificação do código
- ✅ Analisado todos os SelectItems - todos têm valores corretos
- ✅ Verificado defaultValues nos formulários - todos estão adequados
- ✅ Verificado placeholders - não há "alias" sendo usado
- ✅ Verificado schemas de validação - todos corretos

### 3. Possíveis causas restantes:

1. **Problema no navegador/cache**: Dados antigos em cache
2. **Problema de timing**: SelectItems carregando antes dos dados
3. **Problema de estado**: React Hook Form com estado inconsistente
4. **Problema de API**: Dados sendo corrompidos na transmissão
5. **Problema de tradução**: Algum sistema de i18n transformando valores

## Próximos passos para debug:

1. **Limpar cache do navegador**: Ctrl+Shift+Delete
2. **Verificar network tab**: Inspecionar requisições da API
3. **Verificar console do navegador**: Procurar por erros JavaScript
4. **Identificar contexto específico**: Onde exatamente aparece "alias"?

## Questões para o usuário:

1. Em que página específica você vê "alias"?
2. Em que campo específico aparece?
3. Acontece ao cadastrar ou visualizar dados?
4. Você pode tirar um screenshot do problema?