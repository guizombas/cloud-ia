# 🏗️ Arquitetura de Soluções: Cloud-IA

Este documento detalha o design arquitetural do projeto **cloud-ia**. A solução adota um modelo **Cloud Native, Híbrido e Orientado a Eventos** para resolver o desafio de processar requisições de IA Generativa com alta latência sem bloquear o cliente.

---

## 1. Diagrama de Fluxo de Dados

<img width="931" height="581" alt="image" src="https://github.com/user-attachments/assets/ac845f4d-1a4a-4090-85c4-e1b3fb2faae3" />

O fluxo da aplicação é dividido em dois canais: **Entrada (HTTP)** e **Saída (WebSocket)**.

1.  **Cliente (Frontend)** conecta no **WebSocket** (`$connect`) → `ConnectionId` é salvo no **Redis**.
2.  **Cliente** envia mensagem via **API Gateway HTTP** (`POST /chat`).
3.  **Lambda (FaaS)** recebe a requisição, valida, gera um `JobId` e publica na fila **SQS**. Responde HTTP 202 (Accepted) imediatamente.
4.  **Worker (Container)** consome a mensagem da **SQS**.
5.  **Worker** recupera contexto no **DynamoDB/Redis** e chama a **LLM API** (OpenAI/Anthropic).
6.  **Worker** publica a resposta da IA para o **WebSocket Service** usando o `ConnectionId` recuperado do Redis.
7.  **Cliente** recebe a resposta em tempo real.

---

## 2. Componentes e Decisões Técnicas

### 2.1. Camada Híbrida de Computação
A decisão de separar FaaS e Containers foi estratégica:

* **FaaS (Lambdas):** Usado para tarefas rápidas e *stateless* (receber mensagem HTTP, gerenciar conexão WS). Escala a zero para economizar custos.
* **Containers (Worker Pods):** Usado para o processamento "pesado". Mantém conexões longas, processa filas continuamente e evita os limites de *timeout* (29s) das Lambdas ao aguardar a resposta da LLM.

### 2.2. Mensageria e Assincronismo (SQS)
A fila **Amazon SQS** atua como buffer de *backpressure*. Se houver um pico de 10.000 requisições, as Lambdas enfileiram tudo rapidamente, e os Workers processam na velocidade que a API da IA suportar, sem derrubar o sistema.
* *Referência:* Veja detalhes de retries na [Documentação de Resiliência](./RESILIENCE.md).

### 2.3. Estratégia de Dados (Hot vs Cold)
* **Redis (Hot Data):** Armazena o mapeamento `SessionId` ↔ `ConnectionId` e cache de contexto de curto prazo. Necessário para roteamento de mensagens com latência de milissegundos.
* **DynamoDB (Cold/Persist Data):** Banco NoSQL Single-Table para histórico de chat. Escolhido pela capacidade de escalar *throughput* instantaneamente.

---

## 3. Resiliência e Falhas

A arquitetura implementa o padrão **Fail Fast** e proteções contra falhas externas.

* **Circuit Breaker:** Implementado no Worker. Se a API da LLM falhar repetidamente, o circuito abre e o Worker para de tentar, economizando recursos.
* **DLQ (Dead Letter Queue):** Mensagens que falham após N tentativas (ex: erro de *parsing*) são movidas para análise manual, garantindo **Zero Data Loss**.

> Para uma lista completa dos mecanismos (Timeouts, Backoff, etc), consulte [RESILIENCE.md](./RESILIENCE.md).

---

## 4. Interfaces e Contratos

A comunicação entre os serviços segue contratos estritos definidos na documentação da API.

* **Entrada:** REST via `POST /chat`
* **Saída:** Eventos WebSocket assíncronos (`message_completed`, `error`).

> Os payloads JSON e códigos de erro estão documentados em [API.md](./API.md).

---

## 5. Deployment e Infraestrutura

O projeto suporta deployment local (via Docker Compose + Serverless Offline) e em produção (AWS + Kubernetes).

* **Local:** Um serviço customizado em Node.js simula o WebSocket da AWS, pois o LocalStack Free não oferece suporte a API Gateway V2.
* **Produção:** API Gateway nativo gerencia as conexões WebSocket.

> Instruções de deploy detalhadas em [DEPLOYMENT.md](./DEPLOYMENT.md).
