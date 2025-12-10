# 📦 Guia de Deployment — Projeto Cloud Native & Serverless (cloud-ia)

Este documento descreve o processo de deployment da solução híbrida (Serverless + Containers), incluindo a infraestrutura necessária, configuração de serviços, pipeline sugerido e instruções para ambientes locais e cloud.

---

# 🏗️ 1. Visão Geral do Deployment

A aplicação utiliza uma arquitetura que combina:

- **Serverless (FaaS – Lambdas)**: entrada HTTP e gerenciamento de sessões WebSocket  
- **Containers (Workers)**: processamento assíncrono, chamadas à LLM e gravação de histórico  
- **Infraestrutura Gerenciada**:
  - Amazon SQS  
  - DynamoDB  
  - Redis (cache e sessão)  
  - API Gateway HTTP (produção)
  - WebSocket Service customizado (ambiente local)
- **IaC (Infrastructure as Code)**: recomendação de uso de Terraform, Serverless Framework ou AWS SAM  
- **CI/CD**: GitHub Actions para automação do pipeline  

---

# ⚙️ 2. Componentes Necessários

A solução possui os seguintes componentes na infraestrutura de produção:

## **2.1. API Gateway (HTTP + WebSocket)**
- Rotas REST (ex: `POST /chat`)
- Rotas WebSocket (`$connect`, `$disconnect`, `$default`)
- Autenticação (ex: JWT)
- Rate limiting configurado

## **2.2. Funções Serverless (Lambdas)**
Localização no código: `/src/lambdas`

Responsabilidades:
- Receber mensagem do cliente
- Gerar `jobId`
- Enviar mensagens para o SQS
- Registrar `connectionId` no Redis
- Enviar eventos WebSocket via callback

## **2.3. Workers em Containers**
Localização: `/src/worker`

Executados no Kubernetes (produção) ou Docker (local).

Responsáveis por:
- Ler mensagens do SQS
- Chamar API da LLM (OpenAI/Anthropic)
- Salvar mensagens no DynamoDB
- Enviar respostas para o WebSocket via Redis

## **2.4. Filas e Mensageria**
- **SQS principal**
- **Dead Letter Queue (DLQ)** configurada
- Visibilidade e backoff configurados

## **2.5. Banco de Dados**
**DynamoDB** com modelo hierárquico:



User -> Chat -> Message


## **2.6. Cache e Sessões**
**Redis**:
- Mapeamento `sessionId <-> connectionId`
- Cache de contexto de conversa

---

# 🛠️ 3. Deployment Local (Ambiente de Desenvolvimento)

## **3.1. Pré-requisitos**
- Docker & Docker Compose  
- Node.js 18+ (ou Python 3.9+, conforme suas Lambdas)  
- AWS CLI configurado  
- Serverless Framework ou AWS SAM instalado  
- Redis local (Docker)  
- DynamoDB local (opcional)

## **3.2. Passos**

### **1️⃣ Clonar o repositório**
```bash
git clone https://github.com/guizombas/cloud-ia.git
cd cloud-ia
```

### **2️⃣ Instalar dependências
```bash
npm install
```

### **3️⃣ #Subir serviços auxiliares (Redis, Worker, WebSocket)

No ambiente local não há API Gateway WebSocket.
Portanto, um serviço próprio WebSocket deve ser iniciado.

Um docker-compose.yml deve conter ao menos:

- redis

- worker

- websocket-service

### **4️⃣ Deploy das Lambdas

Caso use Serverless Framework:
```bash
serverless deploy --stage dev
```

Isso criará:

Lambda POST /chat

Policies IAM

Fila SQS

DLQ

API Gateway HTTP

### **5️⃣ Verificar endpoints criados

Exemplo:

```bash
serverless info
```

### **☁️ 4. Deployment em Produção (AWS)
#4.1. Infraestrutura como Código (IaC)

# Ferramentas recomendadas:

- Terraform (para a parte AWS + Kubernetes)
- Serverless Framework (para as Lambdas + API Gateway)
- Helm (para deploy no EKS)

# Componentes provisionados via IaC:

- SQS + DLQ
- DynamoDB
- Redis (Elasticache)
- Roles IAM (Lambdas e Workers)
- API Gateway REST + WebSocket
- Lambdas (upload + config)
- Cluster Kubernetes (EKS)
- Worker Deployment + HPA
- Secrets (API_KEY da LLM)

### **🚀 5. Pipeline de CI/CD (GitHub Actions)

Um workflow sugerido:

# 5.1. Para Lambdas

Pipeline:

- Rodar lint/testes
- Empacotar Lambdas
- Deploy via Serverless Framework

# 5.2. Para Workers

Pipeline:

- Build da imagem Docker
- Push no ECR
- Apply do Helm Chart no EKS

### **🧪 6. Testes Pós-Deploy

Após o deploy, validar:

# API HTTP

```bash
curl -X POST https://<api-gateway-url>/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Olá"}'
```

# WebSocket

Conectar usando:

```bash
wscat -c ws://<ws-endpoint>
```

# SQS

Verificar se:

mensagens entram na fila

# DLQ está vazia

# Worker Pod

```bash
kubectl logs deployment/worker
```
# DynamoDB

Verificar histórico no console AWS ou via CLI.

### **🧰 7. Troubleshooting
# Mensagens não chegam ao Worker

- Verificar permissões IAM
- Verificar se Worker está consumindo da fila certa
- Verificar visibilityTimeout
- WebSocket não responde
- Verificar salvamento do connectionId no Redis
- Verificar timeout de sessão
- Circuit Breaker ativando demais
- Confirmar limites de erro da API externa
- Verificar latência da LLM

### **📌 8. Roadmap (Relacionado ao Deployment)
# Prioridade Alta

- Criar WebSocket Service próprio para ambiente local
- Criar Lambda POST /chat
- Criar Worker para ler SQS
- Configurar integração com LLM
- Configurar DynamoDB + Redis

# Prioridade Baixa

- Parameter Store para secrets
- Deploy Kubernetes com Helm local
- Lambdas GET (mensagens + conversas)
- Frontend SPA
- Instrumentação New Relic
- Terraform para toda infraestrutura

### **✔️ 9. Conclusão

Este documento descreve o processo de deployment completo da solução Cloud Native & Serverless.
Com ele, o time consegue:

- Executar localmente
- Fazer deploy em cloud
- Automatizar via CI/CD
- Operar e diagnosticar problemas
- Adicionar novas funcionalidades com segurança


