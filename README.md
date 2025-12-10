**☁️ Projeto Cloud Native & Serverless - Assistente de Conversação (Chat-GPT Style)**

Este repositório contém a implementação do Trabalho Prático 2 da disciplina de Arquitetura de Soluções Cloud Native & Serverless. O projeto consiste em um serviço de chat inteligente, resiliente e escalável, utilizando uma arquitetura híbrida (Serverless + Containers).

## 📋 Integrantes

   **Instituição:** PUC Minas
  
   **Curso:** Arquitetura de Soluções
  
   **Grupo:**
 
    Aline Maria - Matrícula: 234631
   
    Cristiana Elisa - [Inserir Matrícula]
   
    Davi Felipe - Matrícula: 234846
   
    Guilherme Gabriel - [Inserir Matrícula]
  
## 🏗️ Arquitetura da Solução
A solução foi implementada seguindo o desenho arquitetural aprovado no TP1, visando desacoplamento e alta disponibilidade.

**Diagrama de Arquitetura**

<img width="903" height="592" alt="image" src="https://github.com/user-attachments/assets/f4645117-2b04-4123-b72e-4a5a267d2d29" />

(Imagem: Trabalho de Arquitetura de Soluções Cloud Native & Serverless.doc)


**Fluxo de Dados**

   **- Entrada:** O cliente (Web) conecta-se via API Gateway.
    
   **- Processamento Rápido (Serverless):** Funções FaaS (Lambda) recebem a requisição HTTP e a enfileiram no SQS.
    
   **- Processamento Assíncrono (Worker):** Pods/Containers consomem a fila SQS.
    
   **- Inteligência:** O Worker chama a API de LLM externa (OpenAI/Anthropic) protegida por um Circuit Breaker.
    
   **- Resposta:** O resultado é enviado de volta ao cliente via conexão WebSocket e persistido no DynamoDB.

## 🚀 Implementação e Componentes (Código Fonte)

  **1. API Gateway & Entrypoint**
    Tecnologia: [Ex: AWS API Gateway / Kong / Nginx]
    Políticas Implementadas:
    Autenticação: [Ex: Validação de JWT no Authorizer da Lambda]
    Rate Limiting: [Ex: Limite de 100 req/s por usuário para proteção de custos]
    Roteamento: Separação clara entre rotas REST (POST /chat) e rotas WebSocket ($connect, $default).
  
  **2. Compute Layer (Híbrido)**
    FaaS (Serverless):
    Responsável pela recepção de mensagens e gerenciamento de conexões WebSocket.
    Localização no código: /src/lambdas 1
    Workers (Containers/Kubernetes):
    Responsável pelo processamento pesado e comunicação com a LLM. Utiliza containers para evitar timeouts do FaaS em respostas longas da IA.
    Localização no código: /src/worker 2
  
  **3. Persistência e Cache**
    DynamoDB (NoSQL): Utilizado para histórico de chat com padrão de acesso hierárquico (User -> Chat -> Message)3.
    Redis: Cache de contexto e mapeamento de sessões WebSocket (Session ID <-> Connection ID) para baixa latência4.

## 🛡️ Resiliência (Requisito Chave do TP2)
Aplicamos padrões de estabilidade para garantir que o sistema suporte falhas em dependências externas (API da LLM).

  **Mecanisma:** Circuit Breaker
  **Onde foi aplicado?** Worker Service
  **Descrição:** Protege o sistema caso a API da OpenAI caia. Se a taxa de erros passar de X%, o circuito abre e falha rápido ("Fail Fast") sem consumir recursos5.
  
  **Mecanisma:** Retry com Backoff
  **Onde foi aplicado?** Fila SQS
  **Descrição:** Se o processamento falhar, a mensagem retorna à fila e é tentada novamente após um tempo exponencial, garantindo que perguntas não sejam perdidas6.
  
  **Mecanisma:** Dead Letter Queue (DLQ)
  **Onde foi aplicado?** Infraestrutura SQS
  **Descrição:** Mensagens que falham repetidamente são enviadas para uma DLQ para análise posterior.
  
  **Mecanisma:** Timeouts
  **Onde foi aplicado?** Chamadas HTTP
  **Descrição:** Timeouts configurados em 29s nas Lambdas e definições rígidas nas chamadas à API externa.

## 📊 Observabilidade
A aplicação foi instrumentada para fornecer visibilidade completa do fluxo distribuído (Traces, Métricas e Logs).

  **1. Tracing Distribuído**
  Utilizamos [Ex: AWS X-Ray / New Relic / Jaeger] para rastrear a requisição desde o API Gateway, passando pela Fila SQS, até o Worker e a volta via WebSocket.
  Evidência: ![Screenshot do Trace](./docs/trace-exemplo.png)
  
  **3. Métricas (Dashboards)**
  Monitoramos as seguintes métricas vitais (Golden Signals):
  Latência: Tempo de resposta da LLM.
  Tráfego: Quantidade de mensagens na fila SQS.
  Erros: Taxa de falhas no Circuit Breaker.
  Evidência: ![Dashboard de Monitoramento](./docs/dashboard.png)

## 💰 CloudOps & FinOps

  **Infraestrutura como Código (IaC)**
  Toda a infraestrutura foi provisionada via código para garantir reprodutibilidade e auditoria7.
    **Ferramenta:** [Ex: Terraform / Serverless Framework / AWS SAM]
    **Pipeline CI/CD:** O deploy é realizado automaticamente via GitHub Actions8.
  
  **Estratégia de Custos (FinOps)**
    **Scale-to-Zero:** O front-end e a camada de entrada (Lambdas) custam zero quando não utilizados9.
    **Spot Instances:** [Se aplicável] Uso de instâncias Spot para os Workers no Kubernetes para redução de custos computacionais.

## 🛠️ Como rodar o projeto localmente
  
 **Pré-requisitos**
    Docker & Docker Compose
    Node.js v18+ / Python 3.9+
    Conta configurada na AWS (CLI)

  **Passos**
  1. Clone o repositório:
    git clone https://github.com/guizombas/cloud-ia.git
  
  2. Instale as dependências:
    npm install
  
  3. Deploy da infraestrutura:
    serverless deploy --stage dev

-------------------------------------------------------------------------------------------------------------

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
