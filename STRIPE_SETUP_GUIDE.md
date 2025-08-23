# 🏁 Como Ativar Pagamentos Reais no Stripe - Guia Completo

## Por que está em Simulação?

O sistema atual está simulando pagamentos porque usa Price IDs temporários (`price_1234_basico`, `price_1234_profissional`, etc.). Para ativar pagamentos reais, você precisa criar os Price IDs verdadeiros no dashboard do Stripe.

## 🚀 Passos para Ativar Pagamentos Reais

### 1. Acesse o Dashboard do Stripe
- Vá para: https://dashboard.stripe.com/products
- Faça login com sua conta Stripe

### 2. Criar os 4 Produtos/Preços

Para cada plano, você precisa criar um produto com preço:

#### **Plano Básico - R$ 49/mês**
1. Clique em "**Add product**"
2. **Product name**: `DRIVS - Plano Básico`
3. **Description**: `Gestão completa para até 5 veículos`
4. **Pricing model**: `Standard pricing`
5. **Price**: `R$ 49.00` (BRL - Real Brasileiro)
6. **Billing period**: `Monthly`
7. Clique "**Save product**"

**⚠️ IMPORTANTE - Como encontrar o PRICE ID (não Product ID):**
- Após criar o produto, você verá uma lista com o produto criado
- Clique no produto para abrir os detalhes
- Na seção "Pricing", você verá o **Price ID** (começa com `price_...`)
- **NÃO confundir** com Product ID (que começa com `prod_...`)
- O que você precisa é o **PRICE ID**!

**Exemplo:**
- ❌ Product ID: `prod_Abc123` (NÃO usar)
- ✅ **Price ID**: `price_1OaWcJKlTiQx8aM9vE3b8sK2` (USAR ESTE!)

#### **Plano Profissional - R$ 99/mês**
1. Clique em "**Add product**"
2. **Product name**: `DRIVS - Plano Profissional`
3. **Description**: `Gestão completa para até 20 veículos`
4. **Price**: `R$ 99.00` (BRL)
5. **Billing period**: `Monthly`
6. Copie o **Price ID**

#### **Plano Avançado - R$ 200/mês**
1. Clique em "**Add product**"
2. **Product name**: `DRIVS - Plano Avançado`  
3. **Description**: `Gestão completa para até 50 veículos`
4. **Price**: `R$ 200.00` (BRL)
5. **Billing period**: `Monthly`
6. Copie o **Price ID**

#### **Plano Master - R$ 500/mês**
1. Clique em "**Add product**"
2. **Product name**: `DRIVS - Plano Master`
3. **Description**: `Gestão completa para veículos ilimitados + suporte 24/7`
4. **Price**: `R$ 500.00` (BRL)
5. **Billing period**: `Monthly`
6. Copie o **Price ID**

### 3. Atualizar os Price IDs no Sistema

Após criar todos os produtos, você terá 4 Price IDs reais. Substitua no arquivo `server/routes.ts`:

```typescript
// Localizar essa seção no código:
const priceIds = {
  basico: 'price_1234_basico',        // ← Substituir por Price ID real
  profissional: 'price_1234_profissional', // ← Substituir por Price ID real  
  avancado: 'price_1234_avancado',    // ← Substituir por Price ID real
  master: 'price_1234_master'         // ← Substituir por Price ID real
};
```

**Exemplo com Price IDs reais:**
```typescript
const priceIds = {
  basico: 'price_1OaWcJKlTiQx8aM9vE3b8sK2',
  profissional: 'price_1OaWdGKlTiQx8aM9xF4c9tL3', 
  avancado: 'price_1OaWeHKlTiQx8aM9yG5d0uM4',
  master: 'price_1OaWfIKlTiQx8aM9zH6e1vN5'
};
```

### 4. Como Saber Que Funcionou

Depois de substituir os Price IDs reais:
1. Teste mudando de plano na página `/planos`
2. **Se real**: Abrirá checkout do Stripe para pagamento  
3. **Se simulação**: Mostra mensagem "Simulação ativada"

## 🔧 Status Atual do Sistema

**✅ Configurado e Funcionando:**
- Credenciais Stripe (STRIPE_SECRET_KEY, VITE_STRIPE_PUBLIC_KEY)
- API endpoints completos (/api/stripe/create-subscription)
- Database com campos Stripe (customerId, subscriptionId, priceId)
- Interface de usuário para mudança de planos
- Webhooks configurados

**⏳ Faltando Apenas:**
- Price IDs reais do dashboard Stripe (substituir os `price_1234_*`)

## 🚨 Importante

1. **Teste no Modo Test do Stripe primeiro** antes de ativar modo produção
2. **Use cartões de teste** do Stripe para validar o fluxo
3. **Ative webhooks** no Stripe para atualização automática de status
4. **Configure domínio** nas configurações do Stripe para produção

## 🔍 Passo a Passo Visual - Onde Encontrar Price ID

**No Dashboard do Stripe:**

1. **Vá para**: https://dashboard.stripe.com/products
2. **Crie o produto** (como descrito acima)
3. **Clique no produto criado** (na lista de produtos)
4. **Procure pela seção "Pricing"**
5. **Copie o ID que começa com `price_`** (não o que começa com `prod_`)

**Exemplo do que você verá:**
```
Product Details:
ID: prod_Abc123 ← NÃO é este

Pricing:
Price ID: price_1OaWcJKlTiQx8aM9vE3b8sK2 ← É ESTE que você precisa!
Amount: R$49.00
```

## 🚨 Diferença Importante

- **Product ID** (`prod_...`) = Identifica o produto
- **Price ID** (`price_...`) = Identifica o preço/plano específico 

**Para o DRIVS funcionar, você precisa dos 4 PRICE IDs!**

## 📞 Precisa de Ajuda?

Se ainda não conseguir encontrar os Price IDs, me mande um print da tela do Stripe que posso te ajudar a localizar exatamente onde estão!