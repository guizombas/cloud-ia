
# Documentação da API — Projeto Cloud Native & Serverless (cloud-ia)

Este documento descreve todas as APIs expostas pelo projeto cloud-ia, incluindo:

- Endpoints **REST (HTTP)**
- Endpoints **WebSocket**
- Estrutura dos payloads
- Fluxo de requisição e resposta
- Códigos de erro
- Contratos entre Lambda → SQS → Worker → WebSocket

A API é utilizada pelo Frontend para enviar mensagens, receber respostas e consultar o histórico de conversas.

---

# 1. Visão Geral

A API tem dois canais principais:

###  **1. HTTP (REST) — Entrada de mensagens**
Usado para:
- Enviar mensagens do usuário
- Criar jobId
- Inicializar fluxo assíncrono
- Persistir sessão (connectionId via Redis)

###  **2. WebSocket — Saída de mensagens**
Usado para:
- Receber respostas da IA em tempo real
- Atualizações do status do job
- Eventos de conexão/desconexão

---

# 2. Endpoints HTTP (REST)

## **2.1 POST /chat**
Envia uma nova mensagem para processamento pela IA.

### ⚠️ Possíveis Códigos de Erro

- 400	Payload inválido
- 401	Token inválido / expirado (se JWT habilitado)
- 429	Rate limit excedido
- 500	Erro interno na Lambda
- 502	Falha ao enviar para o SQS
- 503	Redis indisponível / WebSocket offline

## ** 3. Endpoints WebSocket

A conexão WebSocket é usada pelo cliente para:

- Receber respostas da IA
- Atualização de status do job
- Mensagens parciais (streaming) — opcional
- Notificações de erro

# 3.1 Rota: $connect

Chamado automaticamente ao conectar.

#  Request

Conexão WebSocket padrão.

Response

```bash
{
  "status": "connected",
  "connectionId": "WS-xyz456"
}
```

O connectionId é salvo no Redis para roteamento posterior.

# 3.2 Rota: $disconnect

Chamado quando o cliente encerra a conexão.

Responsável por:

- Limpar sessionId / connectionId do Redis
- Encerrar heartbeat (se configurado)

# 3.3 Rota: $default

Usada para mensagens não roteadas.

Payload recebido pelo Worker ao enviar a resposta:

```bash
{
  "jobId": "job-7f8f2d3c",
  "content": "Olá! Como posso ajudar?",
  "timestamp": 1733788120
}
```

###  4. Mensagens Enviadas pelo Worker ao WebSocket

Quando o processamento é concluído, o Worker envia ao WebSocket Service:

# Mensagem de Sucesso

```bash
{
  "event": "message_completed",
  "jobId": "job-7f8f2d3c",
  "sessionId": "abc123",
  "content": "Olá! Como posso te ajudar hoje?",
  "metadata": {
    "model": "gpt-4.1",
    "tokens": 152
  }
}
```

# Mensagem de Erro (Circuit Breaker, Timeout, Falha no SQS, etc.)

```bash
{
  "event": "error",
  "jobId": "job-7f8f2d3c",
  "message": "Erro ao processar a requisição",
  "details": "Timeout atingido ao chamar a API LLM."
}
```

### 5. Conclusão

Este documento formaliza o contrato da API utilizado pelo serviço cloud-ia.
Com ele, qualquer frontend ou integrador externo pode consumir o sistema com segurança e previsibilidade.
