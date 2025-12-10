# Changelog
Todas as mudanças importantes deste projeto serão documentadas aqui.

O formato segue as recomendações do **Keep a Changelog**  
➡ https://keepachangelog.com/pt-BR/1.0.0/

E utilizamos **Versionamento Semântico (SemVer)**  
➡ https://semver.org/lang/pt-BR/

---

## [1.0.0] - 2025-12-09
### Primeira versão do projeto — Estrutura Inicial (TP2)

Esta release marca a primeira entrega do projeto **Cloud Native & Serverless – Assistente de Conversação (Chat-GPT Style)**, seguindo o desenho arquitetural definido no TP1.

### Adicionado
- Estrutura inicial do repositório **cloud-ia**.
- Criação do README completo com:
  - Descrição do projeto.
  - Arquitetura proposta.
  - Fluxo de dados detalhado.
  - Componentes principais (API Gateway, FaaS, Workers, SQS, DynamoDB, Redis).
  - Estratégia de resiliência (Circuit Breaker, Retry, DLQ, Timeouts).
  - Observabilidade (Tracing, Métricas, Logs).
  - Estratégias de CloudOps e FinOps.
  - Passo a passo para rodar o projeto localmente.
  - Lista de tarefas (To-do list priorizada).
- Estrutura inicial do código para:
  - Lambdas (entrypoints do chat).
  - Workers para processamento assíncrono.
  - Comunicação com SQS.
  - Preparação do ambiente Serverless + Containers.
- Base para infraestrutura Serverless + integração com Docker/Kubernetes.
- Organização inicial do repositório para futuras implementações (infra, monitoramento, CI/CD, etc).

---

## Planejado para próximas versões (Backlog)

> *Esses itens ainda **não fazem parte da versão 1.0.0**, mas já estão mapeados como futuras releases:*

### Próxima Release (1.1.0)
- Criar base para todas as Lambdas.
- Implementar **Lambda POST /chat**:
  - gerar `jobId`
  - enviar mensagem para SQS
  - salvar `connectionId` no Redis.
- Criar Worker Pod que lê mensagens do SQS.
- Integrar chamada à API LLM (OpenAI/Anthropic) no Worker.
- Implementar escrita/leitura de mensagens no DynamoDB.
- Implementar retorno via WebSocket usando connectionId do Redis.
- Criar serviço WebSocket local (substituindo API Gateway WS no Localstack).
- Gerar connectionId automaticamente ao conectar.

### Future Release (1.2.0)
- Salvar API_KEY no Parameter Store.
- Implementar refresh de sessão WebSocket.
- Criar ambiente Kubernetes local usando Helm.
- Criar lambdas GET de mensagens e GET de conversas.

### Future Release (1.3.0)
- Implementar cache de mensagens no Redis.
- Detalhar README com diagrama e contexto aprimorado.
- Criar frontend que consome o serviço.

### Future Release (1.4.0)
- Adicionar instrumentação completa no New Relic.
- Implementar infraestrutura como código (Terraform).

---

## Histórico
Este é o primeiro release oficial do projeto.  
As versões futuras documentarão incrementos, correções e melhorias.

---

## Legenda
- **Adicionado** – Novas funcionalidades.
- **Alterado** – Mudanças em funcionalidades existentes.
- **Removido** – Funcionalidades eliminadas.
- **Corrigido** – Correções de bugs.
- **Depreciado** – Funcionalidades que serão removidas futuramente.
- **Segurança** – Melhorias relacionadas à segurança.
