import amqp from "amqplib";

let channel;

const QUEUE = "jobQueue";
const DLQ = "failed_jobs";

export const connectQueue = async () => {

  const connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://localhost");

  channel = await connection.createChannel();

  // DLQ first
  await channel.assertQueue(DLQ, {
    durable: true,
  });

  // main queue with DLQ config
  await channel.assertQueue(QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": DLQ,
    },
  });

  console.log("RabbitMQ Connected");
};

export const sendToQueue = async (job) => {

  channel.sendToQueue(
    QUEUE,
    Buffer.from(JSON.stringify(job)),
    { persistent: true }
  );

};

export const getChannel = () => {
  return channel;
};