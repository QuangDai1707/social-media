import { Kafka } from 'kafkajs';
import WebSocket from 'ws';

// Kafka setup
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092'], // Kafka broker address
});

const consumer = kafka.consumer({ groupId: 'wiki-group' });

// Function to consume messages from Kafka and send to WebSocket
export const startConsuming = async (ws: WebSocket) => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'recent-changes', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const content = message.value?.toString();
            console.log('Sending message to WebSocket:', content);
            
            // Forward the message to WebSocket clients
            if (content && ws.readyState === WebSocket.OPEN) {
                ws.send(content);
            }
        },
    });
};
