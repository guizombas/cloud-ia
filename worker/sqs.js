const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");

const sqs = new SQSClient({
    region: process.env.AZ_REGION,
    endpoint: process.env.LOCALSTACK_URL
});

module.exports = {
    poll: async () => {
        const params = {
            QueueUrl: process.env.SQS_URL,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 20
        };
        return await sqs.send(new ReceiveMessageCommand(params));
    },

    deleteMessage: async (receiptHandle) => {
        return sqs.send(new DeleteMessageCommand({
            QueueUrl: process.env.SQS_URL,
            ReceiptHandle: receiptHandle
        }));
    }
};