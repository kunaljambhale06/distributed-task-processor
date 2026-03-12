import amqp from "amqplib";

let channel;

const QUEUE = "jobQueue";
const DLQ = "failed_jobs";

export const connectQueue = async () => {
  const connection = await amqp.connect("amqp://localhost");

  channel = await connection.createChannel();

  await channel.assertQueue(QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": DLQ,
    },
  });

  await channel.assertQueue(DLQ, {
    durable: true,
  });

  console.log("RabbitMQ Connected");
};

export const sendToQueue = async (data) => {
  channel.sendToQueue(
    QUEUE,
    Buffer.from(JSON.stringify(data))
  );
};