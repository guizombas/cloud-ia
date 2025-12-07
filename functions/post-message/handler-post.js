const crypto = require('crypto');
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const redis = require('redis');
const sqsClient = new SQSClient({ region: process.env.AZ_REGION });
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

const QUEUE_URL = process.env.QUEUE_URL;

exports.handler = async (event) => {
  try {

    const body = JSON.parse(event.body || "{}");
    if (!body.content || !body.role) {
      return { statusCode: 400, body: JSON.stringify({ error: "invalid payload" }) };
    }

    const connectionId = body.connectionId;
    const conversationId = body.conversationId || crypto.randomUUID();
    const jobId = crypto.randomUUID();

    const message = {
      connectionId,
      conversationId,
      role: body.role,
      content: body.content,
      jobId,
      timestamp: Date.now()
    };


    await sqsClient.send(new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(message)
    }));

    console.log(`Enqueued message for jobId ${jobId}`);

    if (!redisClient.isOpen) {
      console.log("Connecting to Redis...");
      await redisClient.connect();
      console.log("Connected to Redis");
    }

    if (connectionId) {

      console.log(`Storing connectionId for jobId ${jobId} in Redis...`);
      await redisClient.set("job:" + jobId, connectionId, {
        expiration: {
          type: 'EX',
          value: 300 // 5 minutes
        }
      });

      console.log(`Stored connectionId for jobId ${jobId} in Redis`);
    }

    return {
      statusCode: 200, body: JSON.stringify({
        jobId,
        conversationId,
        timestamp: message.timestamp
      })
    };
  } catch (e) {
    console.error("Error in handler:", e);
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: "internal" }) };
  }
};