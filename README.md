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
