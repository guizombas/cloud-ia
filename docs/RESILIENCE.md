# Resiliência da Aplicação — Projeto Cloud Native & Serverless (cloud-ia)

Este documento descreve os mecanismos de **resiliência**, **tolerância a falhas** e **estabilidade operacional** implementados (e planejados) no projeto cloud-ia.  
A resiliência é um requisito essencial do TP2, garantindo que o sistema continue funcional mesmo durante falhas de APIs externas, picos de tráfego ou indisponibilidade de componentes.

---

# 1. Objetivos de Resiliência

A solução foi projetada para:

- Evitar que falhas da API LLM derrubem o sistema  
- Proteger a infraestrutura de custos inesperados  
- Garantir que nenhuma mensagem do usuário seja perdida  
- Isolar falhas entre componentes  
- Degradar de forma controlada (fail fast)  
- Permitir reprocessamento seguro e automático  

Esses mecanismos formam a base do comportamento resiliente da arquitetura.

---

# 2. Mecanismos Ativos de Resiliência

A arquitetura utiliza quatro mecanismos principais:

1. **Circuit Breaker**  
2. **Retry com Backoff Exponencial**  
3. **Timeouts (Lambda + Worker + HTTP)**  
4. **Dead Letter Queue (DLQ)**  
5. **Mensageria Assíncrona (SQS) para absorver picos**  
6. **Cache e desacoplamento via Redis**  

A seguir, cada mecanismo é detalhado.

---

# 3. Circuit Breaker

### Onde é aplicado?
No **Worker Pod**, responsável por chamar a API da LLM (OpenAI/Anthropic).

### Objetivo
Evitar que o sistema desperdice recursos tentando acessar uma API de IA que está:

- Fora do ar  
- Com alta latência  
- Com taxa de erro elevada  
- Sofrendo throttling  

### Funcionamento
O Worker monitora a taxa de falhas em janelas de tempo.

Se a taxa ultrapassar o limite (ex: X%):

- O **circuito abre**
- Todas as novas requisições falham **instantaneamente (fail fast)**
- Isso preserva CPU, memória e custos

### Exemplo de resposta enviada ao cliente

```bash
 "event": "error",
  "message": "Circuit Breaker ativado: API LLM indisponível.",
  "jobId": "job-123"
```

# Benefícios

- Impede cascata de falhas
- Reduz custo com chamadas externas
- Mantém o sistema estável durante incidentes

### 4. Retry com Backoff Exponencial

# Onde é aplicado?

- Na fila SQS
- No Worker, ao consumir mensagens
- Nas chamadas à LLM

# Objetivo

- Garantir reprocessamento automático de mensagens em casos de:
- Falhas transitórias
- Erros de rede
- Timeout temporário
- Throttling da LLM

# Funcionamento

Cada falha faz a mensagem retornar à SQS.
A cada nova tentativa, o delay aumenta (backoff exponencial).

Exemplos:

- 1ª tentativa → imediato
- 2ª tentativa → 2s
- 3ª tentativa → 4s
- 4ª tentativa → 8s

# Benefícios

- Alta recuperação automática
- Baixa necessidade de intervenção humana
- Evita tempestades de retries simultâneos

### 5. Timeouts

#Onde são aplicados?

- Lambdas (29 segundos — limite da AWS)
- Worker Pod (HTTP timeout rígido para LLM)
- Chamadas WebSocket (keep-alive)

# Por que são importantes?

Sem timeouts, os processos poderiam ficar:

- Travados
- Consumindo CPU eternamente
- Travando filas

# Configuração recomendada

- Lambda	-> 29s
- Worker → LLM	-> 5–10s
- Redis → Worker ->	500ms
- DynamoDB → Worker	-> 1s

Se o timeout for ultrapassado, é disparado retry ou fail fast.

### 6. Dead Letter Queue (DLQ)

# Onde é aplicada?

Na infraestrutura do Amazon SQS.

# Objetivo

- Armazenar mensagens que falharam repetidamente, evitando:
- Perda de mensagens
- Loops infinitos de reprocessamento

# Funcionamento

- Se uma mensagem falhar X vezes (ex: 5):
- Ela é enviada automaticamente para a DLQ
- O time pode analisá-la manualmente
- Caso necessário, reenviar para a fila principal

# Benefícios

- Alta confiabilidade
- Diagnóstico facilitado
- Nenhuma mensagem é perdida

### 7. Mensageria Assíncrona (SQS)

A fila SQS é o pilar da resiliência.

# Benefícios:

- Absorve picos de tráfego
- Evita sobrecarga das Lambdas
- Permite que os Workers processem no seu ritmo
- Evita perda de requisições caso a LLM esteja lenta
- Permite retry automático
- Esse é o padrão recomendado para workloads de IA.

### 8. Redis como buffer resiliente

- Redis é utilizado para:
- Guardar connectionId (roteamento rápido)
- Cache de contexto com TTL
- Evitar idas desnecessárias ao DynamoDB
- Alta disponibilidade (ms de latência)

# Se Redis falhar:

- Lambda responde com erro controlado
- Sistema não trava

### 9. Resiliência no WebSocket

Como o LocalStack Free não suporta API Gateway WebSocket, o projeto utiliza um serviço customizado de WebSocket.

Resiliências aplicadas:

- Heartbeat/ping para evitar conexões mortas
- Reconexão automática do cliente (frontend)
- Refresh periódico do connectionId (planejado)
- Cache de sessão no Redis


### 12. Conclusão

O sistema cloud-ia foi projetado com uma camada completa de mecanismos de resiliência, garantindo:

- Alta disponibilidade
- Tolerância a falhas externas
- Processamento assíncrono seguro
- Degradação elegante (fail fast)
- Nenhuma perda de mensagens
- Controle de custos (FinOps)
