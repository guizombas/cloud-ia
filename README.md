# ☁️ Projeto Cloud Native & Serverless - Assistente de Conversação Inteligente

Este repositório contém a implementação completa do **Trabalho Prático 2**, apresentando um serviço de chat resiliente e escalável que utiliza uma arquitetura híbrida (Serverless + Containers).

## 📋 Integrantes
* **Instituição:** PUC Minas
* **Curso:** Arquitetura de Soluções
* **Grupo:**
  * Aline Maria
  * Cristiana Elisa
  * Davi Felipe
  * Guilherme Gabriel

# ☁️ Cloud-IA: Assistente de Conversação Serverless & Cloud Native

> **Versão:** 1.0.0 (Estrutura Inicial - TP2)

O **cloud-ia** é um serviço de chat resiliente e escalável, projetado com uma arquitetura híbrida que combina a agilidade do **Serverless** com a robustez de **Containers**.

O projeto foi desenvolvido como parte do Trabalho Prático 2 de **Arquitetura de Soluções** (PUC Minas), focando em alta disponibilidade, tolerância a falhas e processamento assíncrono de IA Generativa.

---

## 🚀 Funcionalidades & Diferenciais

* **Arquitetura Híbrida:** API Gateway + Lambdas para ingestão rápida (HTTP/WS) e Workers em Containers para processamento pesado (LLM).
* **Comunicação Assíncrona:** Uso de filas **SQS** para *backpressure* e desacoplamento.
* **Alta Resiliência:** Implementação de **Circuit Breaker**, **Retries com Backoff Exponencial** e **Dead Letter Queues (DLQ)**.
* **Tempo Real:** Respostas via **WebSocket** com roteamento otimizado via **Redis**.
* **Persistência Escalável:** Histórico de conversas armazenado no **DynamoDB** (Single-Table Design).

---

## 📚 Documentação Oficial

A documentação detalhada foi movida para a pasta [`/docs`](./docs) para melhor organização:

* [**Arquitetura e Fluxo de Dados**](./docs/ARCHITECTURE.md): Entenda o funcionamento híbrido e as decisões de design.
* [**Guia de Deployment**](./docs/DEPLOYMENT.md): Passo a passo para rodar localmente (Docker) ou em produção (AWS).
* [**API Reference**](./docs/API.md): Contratos HTTP (`POST /chat`) e eventos WebSocket.
* [**Resiliência e Falhas**](./docs/RESILIENCE.md): Detalhes sobre Circuit Breaker, Timeouts e DLQ.
* [**Changelog**](./docs/CHANGELOG.md): Histórico de versões e Roadmap.

---

## 🛠️ Tecnologias

* **Cloud:** AWS (SQS, DynamoDB, API Gateway, Lambda)
* **Compute:** Node.js / Python (Workers e Lambdas)
* **Data:** Redis (Cache/Sessão) e DynamoDB (NoSQL)
* **DevOps:** Serverless Framework, Docker Compose.

---

## ⚡ Quick Start (Local)

Para rodar o ambiente de desenvolvimento, utilizamos uma abordagem híbrida com serviços locais simulados.

### Pré-requisitos
* Docker & Docker Compose
* Node.js 18+
* Serverless Framework (`npm install -g serverless`)

### Passos

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/guizombas/cloud-ia.git](https://github.com/guizombas/cloud-ia.git)
    cd cloud-ia
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Suba a infraestrutura local (Redis, Worker, WebSocket Service):**
    > Como o LocalStack Free não suporta API Gateway WebSocket, usamos um serviço customizado localmente.
    ```bash
    docker-compose up -d
    ```

4.  **Faça o deploy das Lambdas e Recursos AWS (SQS/DynamoDB):**
    ```bash
    serverless deploy --stage dev
    ```

5.  **Teste a API:**
    ```bash
    # Enviar mensagem
    curl -X POST http://localhost:3000/chat -d '{"message": "Olá, IA!"}'
    ```

---

## 🗺️ Roadmap (Próximos Passos)

Conforme definido no [CHANGELOG](./docs/CHANGELOG.md):

- [x] **v1.1.0:** Implementação completa da Lambda POST /chat e integração do Worker com OpenAI/Anthropic.
- [ ] **v1.2.0:** Segurança com Parameter Store e Refresh de Sessão WS.
- [ ] **v1.3.0:** Frontend SPA e Cache de mensagens.
- [ ] **v1.4.0:** IaC com Terraform e Monitoramento New Relic.
