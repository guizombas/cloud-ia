# Observabilidade e Monitoramento — Cloud-IA

Este documento descreve a estratégia de **Observabilidade** do projeto cloud-ia.
Devido à natureza assíncrona e distribuída da arquitetura (Serverless + Filas + Containers), a observabilidade não é opcional, mas mandatória para entender o fluxo completo da requisição e garantir a estabilidade operacional.

---

## ☁️ 1. O Desafio de Rastreamento (Distributed Tracing)

Nesta arquitetura, uma requisição de chat não começa e termina no mesmo serviço de forma síncrona. Ela atravessa barreiras onde o contexto pode ser perdido facilmente:

1.  **FaaS HTTP:** Recebe o POST e retorna `202 Accepted` (o cliente "solta" a conexão HTTP).
2.  **SQS:** A mensagem fica "em repouso" na fila aguardando processamento.
3.  **Worker:** Processa a mensagem, recupera contexto e chama a LLM.
4.  **WebSocket:** Entrega a resposta ao cliente em outro canal.

Sem uma estratégia de **Rastreamento Distribuído**, os logs ficam isolados e é impossível saber se a lentidão ocorreu na fila (falta de workers), no processamento (código lento) ou na API externa (OpenAI).

---

## 🚀 2. Ferramentas da Stack

A stack de observabilidade planejada é composta por:

* **AWS CloudWatch:** Logs brutos de Lambdas, métricas nativas de fila SQS e alarmes de infraestrutura básica.
* **New Relic (APM & Tracing):** Ferramenta principal para correlacionar os serviços e visualizar o trace completo (*End-to-End*).
* **Logs Estruturados (JSON):** Padrão de escrita de log para facilitar a ingestão e busca automatizada.

---

## ➡️ 3. Estratégia de Correlação (Trace ID)

Para unir os logs de componentes distintos, todo o fluxo deve compartilhar um identificador único.

### 3.1. O Fluxo do `traceId`

1.  **Geração:** O Frontend envia (ou a Lambda `POST /chat` gera) um `traceId` único (UUID) no início da requisição. O `jobId` também pode atuar como identificador de negócio.
2.  **Propagação:**
    * **Lambda -> SQS:** O `traceId` é injetado nos `MessageAttributes` da mensagem SQS.
    * **SQS -> Worker:** O Worker extrai o `traceId` dos atributos antes de iniciar o processamento.
    * **Worker -> Logs:** Todo log gerado pelo Worker deve conter esse ID.
    * **Worker -> WebSocket:** A resposta final inclui o ID para que o Frontend possa medir a latência total (Time to First Token).

---

## ✨ 4. Métricas Chave (Golden Signals)

Monitoramos quatro categorias principais de métricas para garantir a saúde do sistema.

### 4.1. Latência (Performance)
Precisamos saber onde o tempo está sendo gasto:
* **SQS Dwell Time (Age of Message):** Quanto tempo a mensagem ficou parada na fila esperando um Worker? (Métrica crítica para *Auto-scaling*).
* **Worker Processing Time:** Tempo total de execução do script de negócio.
* **LLM Response Time:** Latência pura da API da OpenAI/Anthropic (fator externo).

### 4.2. Tráfego (Throughput)
* **RPM:** Requisições por minuto no endpoint `/chat`.
* **MPS:** Mensagens processadas por segundo pelos Workers.
* **Conexões Ativas:** Número de clientes conectados no WebSocket simultaneamente.

### 4.3. Erros (Confiabilidade)
* **Circuit Breaker State:** Monitorar transições para o estado `OPEN`. Isso indica falha massiva na IA externa.
* **DLQ Depth:** Quantidade de mensagens na *Dead Letter Queue*. Deve ser sempre zero. Se subir, indica bugs ou dados inválidos.
* **Taxa de Erros 4xx/5xx:** No API Gateway e nas chamadas à LLM.

### 4.4. Métricas de Negócio (FinOps)
Dados para cruzar performance técnica com impacto financeiro:
* **Tokens por Minuto:** Consumo de tokens da LLM (custo direto).
* **Custo por Job:** Média de custo baseada no tamanho do contexto.

---

## 📚 5. Padrão de Logs (Structured Logging)

Para facilitar a busca no CloudWatch ou New Relic, os logs **não devem ser texto puro**, mas sim objetos JSON.

**Exemplo de Log de Sucesso no Worker:**
```json
{
  "level": "info",
  "timestamp": "2025-12-10T14:30:00Z",
  "service": "worker-chat",
  "traceId": "abc-123-xyz",
  "jobId": "job-999",
  "action": "llm_request_success",
  "duration_ms": 1540,
  "metadata": {
    "model": "gpt-4",
    "tokens_input": 50,
    "tokens_output": 100
  }
}
```
**Exemplo de Log de Erro (Circuit Breaker):**
```json
{
  "level": "error",
  "timestamp": "2025-12-10T14:31:00Z",
  "service": "worker-chat",
  "traceId": "def-456-uvw",
  "alert_type": "circuit_breaker_open",
  "reason": "High failure rate from LLM provider",
  "failure_count": 5
}
```

---

## ⚡ 6. Alertas e Alarmes (SRE)

Definição de gatilhos para acionamento da equipe de engenharia.

|Severidade | Métrica	| Limite (Threshold)| Ação Recomendada|
| :--- | :---: | :---: | ---: |
| **CRÍTICA**	| DLQ Depth	| > 0 mensagens	| Intervenção manual imediata. Risco de perda de dados. |
| **ALTA**	| Circuit Breaker |	Status = Open |	Investigar status da OpenAI. O sistema está degradado. |
| **MÉDIA**	| SQS Age |	> 10 segundos |	Sistema lento. Verificar necessidade de escalar mais Workers. |
| **BAIXA**	| Erro 4xx |	> 5% total	| Investigar possível bug no Frontend ou Payload inválido. |

---

## 🗺️ 7. Roadmap de Observabilidade

- [ ] Implementar logs estruturados JSON básicos (CloudWatch).
- [ ] Garantir propagação do traceId (Lambda -> SQS -> Worker).
- [ ] **v1.4.0:** Adicionar instrumentação completa com Agente New Relic e criação de Dashboards unificados.
