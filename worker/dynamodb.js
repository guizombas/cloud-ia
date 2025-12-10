const { DynamoDBClient, PutItemCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");

const db = new DynamoDBClient({
    region: process.env.AZ_REGION,
    endpoint: process.env.LOCALSTACK_URL
});

const TABLE = process.env.DYNAMODB_TABLE;

module.exports = {
    saveMessage: async (conversationId, role, content) => {
        await db.send(new PutItemCommand({
            TableName: TABLE,
            Item: {
                conversationId: { S: conversationId },
                timestamp: { N: Date.now().toString() },
                role: { S: role },
                content: { S: content }
            }
        }));
    },

    getConversation: async (conversationId) => {
        const result = await db.send(new QueryCommand({
            TableName: TABLE,
            KeyConditionExpression: "conversationId = :cid",
            ExpressionAttributeValues: { ":cid": { S: conversationId } }
        }));
        return result.Items || [];
    }
};
