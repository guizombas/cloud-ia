# ☁️ Projeto Cloud Native & Serverless - Assistente de Conversação Inteligente

Este repositório contém a implementação completa do **Trabalho Prático 2**, apresentando um serviço de chat resiliente e escalável que utiliza uma arquitetura híbrida (Serverless + Containers).

## 📋 Integrantes
* **Instituição:** PUC Minas
* **Curso:** Arquitetura de Soluções
* **Grupo:**
  * Aline Maria - [Matrícula]
  * Cristiana Elisa - [Matrícula]
  * Davi Felipe - [Matrícula]
  * Guilherme Gabriel - [Matrícula]

---

## 🏗️ Arquitetura e Fluxo de Dados

A solução combina a agilidade do Serverless para o Front-end/API com a robustez de Containers (Workers) para o processamento pesado de IA.

1.  **Entrada:** Usuário envia mensagem via Frontend → **API Gateway**.
2.  **Ingestão (FaaS):** Lambda recebe o request, valida e publica na fila **SQS** para processamento assíncrono.
3.  **Processamento (Worker):**
    * O componente **Worker** consome a fila SQS.
    * Recupera o contexto da conversa no **Redis** (Cache) ou **DynamoDB**.
    * Realiza a chamada à API de LLM (OpenAI/Anthropic).
4.  **Resposta:** O Worker envia a resposta gerada diretamente ao cliente via conexão **WebSocket**.

<img width="903" height="592" alt="image" src="https://github.com/user-attachments/assets/f4645117-2b04-4123-b72e-4a5a267d2d29" />

(Imagem: Trabalho de Arquitetura de Soluções Cloud Native & Serverless.doc)

---

## ⚙️ Detalhes da Implementação: O Worker

O **Worker** é o coração do processamento desta aplicação. Diferente das funções Serverless (que possuem tempo de vida curto), o Worker roda em container para gerenciar conexões longas e processamento complexo sem risco de *timeout*.

* **Localização:** `/src/worker`
* **Tecnologia:** Python / Node.js
* **Responsabilidades:**
    * Consumo escalável da fila SQS.
    * Orquestração da chamada à IA.
    * Gerenciamento de estado (State Management) das mensagens.

---

## 🛡️ Resiliência e Melhorias (Novidades)

Nesta versão, implementamos padrões robustos de resiliência para garantir que o serviço continue funcionando mesmo com instabilidades na API de IA.

### 1. Circuit Breaker
Implementado no `Worker` para proteger o sistema contra falhas na API externa (LLM).
* **Funcionamento:** Se a API da OpenAI/Anthropic começar a falhar repetidamente (ex: > 5 erros em 10s), o circuito "abre" e o Worker para de tentar enviar requisições temporariamente, retornando um erro amigável imediatamente ("Fail Fast"). Isso evita o consumo desnecessário de recursos e custos.
* *Status:* ✅ Implementado e testado.

### 2. Retries com Exponential Backoff
Na leitura da fila SQS.
* **Funcionamento:** Caso ocorra um erro transiente (ex: falha de rede momentânea), a mensagem não é perdida. Ela retorna à fila e é processada novamente após um intervalo de tempo crescente (2s, 4s, 8s...), garantindo eventual consistência.

### 3. Dead Letter Queue (DLQ)
* **Funcionamento:** Mensagens que falham após `N` tentativas são movidas para uma fila segregada (DLQ) para análise manual, garantindo que nenhum dado do cliente seja perdido silenciosamente.

---

## 📊 Observabilidade

A aplicação agora conta com instrumentação para monitoramento em tempo real.

* **Traces:** Rastreamento distribuído (FaaS → SQS → Worker) para identificar gargalos de latência.
* **Métricas:** Monitoramento de:
    * *Throughput* de mensagens na fila.
    * Taxa de erros no Circuit Breaker.
    * Latência da API de LLM.
* **Logs Estruturados:** Logs em formato JSON para fácil ingestão e busca.

---

## 🚀 Como executar o Worker localmente

1.  Configure as variáveis de ambiente:
    ```bash
    cp .env.example .env
    # Preencha suas chaves da AWS e OpenAI API Key
    ```
2.  Instale as dependências:
    ```bash
    cd src/worker
    npm install  # ou pip install -r requirements.txt
    ```
3.  Inicie o serviço:
    ```bash
    npm start    # ou python worker.py
    ```

---

## 💰 CloudOps & FinOps

* **Infraestrutura como Código (IaC):** Todo o ambiente (Filas, Tabelas, Lambdas) é provisionado automaticamente.
* **Controle de Custos:** O uso de filas SQS permite "achatar" a curva de requisições, evitando que picos de tráfego disparem custos excessivos de concorrência na LLM.

---

## 🛠️ Como rodar o projeto localmente
  
 **Pré-requisitos**
 
  Docker & Docker Compose
  
  Node.js v18+ / Python 3.9+
  
  Conta configurada na AWS (CLI)

  **Passos**
  
1.  Clone o repositório:
    ```bash
    git clone https://github.com/guizombas/cloud-ia.git
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Deploy da infraestrutura:
    ```bash
    serverless deploy --stage dev
    ```

---

## Tolist

Prioridades:
- [x] Criar base para criação de lambdas
- [x] Criar lambda de POST de mensagem (gerar jobId, enviar para fila SQS e salvar connection id no redis)
- [ ] Criar worker pod que lê do SQS
- [ ] No worker pod, implementar chamada para a API LLM (passar API_KEY no .env)
- [ ] No worker pod, implementar leitura e escrita de mensagens da conversa no dynamodb
- [ ] No worker pod, implementar retorno no websocket lendo connection id do redis
- [ ] Criar serviço que sobe conexão websocket (não tem API Gateway WebSocket no Localstack free)
- [ ] Gerar connectionId e retornar na conexão no serviço websocket

Menor prioridade:
- [ ] Usar o parameter store para salvar API_KEY
- [ ] implementar refresh de sessão websocket 
- [ ] implementar kubernets local usando helm
- [ ] Criar lambda de GET de mensagens
- [ ] Criar lamda de GET de conversas
- [ ] Implementar cache de mensagens no redis no worker e no 
- [ ] Detalhar readme com arquitetura e diagrama e contexto
- [ ] Criar frontend que faz as chamadas
- [ ] Adicionar instrumentação no newRelic
- [ ] Fazer parte de infra como código (terraform)
