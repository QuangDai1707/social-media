import { Kafka } from 'kafkajs';
import EventSource from 'eventsource';

// Set up Kafka producer
const kafka = new Kafka({
  clientId: 'wikimedia-stream-producer',
  brokers: ['localhost:9092'],  // Replace with your Kafka broker
});

const producer = kafka.producer();

// Wikimedia stream URL
const wikiStreamURL = 'https://stream.wikimedia.org/v2/stream/recentchange';

// Function to produce messages to Kafka
export const startProducing = async () => {
  await producer.connect();

  // Connect to Wikimedia stream
  const eventSource = new EventSource(wikiStreamURL);

  eventSource.onmessage = async (event) => {
    const recentChange = JSON.parse(event.data);
    console.log('Sending recent change to Kafka:', recentChange);

    // Produce the message to Kafka
    await producer.send({
      topic: 'recent-changes',  // Kafka topic to send messages to
      messages: [
        { value: JSON.stringify(recentChange) },
      ],
    });
  };

  eventSource.onerror = (error) => {
    console.error('Error in Wikimedia stream:', error);
  };
};
