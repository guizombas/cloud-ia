require("dotenv").config();
const { poll, deleteMessage } = require("./sqs");
const { askLLM } = require("./llm");
const { saveMessage, getConversation } = require("./dynamodb");
const { getConnectionId } = require("./redis");
const axios = require("axios");

async function run() {
    console.log("Worker iniciado. Aguardando mensagens...");

    while (true) {
        const msg = await poll();
        if (!msg.Messages) continue;

        const m = msg.Messages[0];
        const body = JSON.parse(m.Body);

        console.log("Mensagem recebida:", body);

        const { jobId, conversationId, content } = body;

        // Salva a mensagem do usuário
        await saveMessage(conversationId, "user", content);

        // Recupera histórico se quiser contexto
        const history = await getConversation(conversationId);

        // Gera resposta LLM
        const answer = await askLLM(content);

        // Salva resposta
        await saveMessage(conversationId, "assistant", answer);

        // Recupera connectionId no Redis
        const connectionId = await getConnectionId(jobId);

        if (connectionId) {
            console.log(`Enviando resposta ao cliente ${connectionId}`);
            await axios.post(process.env.WS_CALLBACK_URL, {
                connectionId,
                message: answer
            });
        }

        // Apaga do SQS
        await deleteMessage(m.ReceiptHandle);
    }
}

run();