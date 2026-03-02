import amqp from "amqplib";

let channel;

export const connectQueue = async () => {
  const connection = await amqp.connect("amqp://localhost");
  channel = await connection.createChannel();

  // ✅ Declare with SAME config as worker
  await channel.assertQueue("jobs", {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": "failed_jobs"
    }
  });

  console.log("RabbitMQ Connected");
};

export const sendToQueue = async (data) => {
  if (!channel) throw new Error("Queue not initialized");

  channel.sendToQueue(
    "jobs",
    Buffer.from(JSON.stringify(data)),
    { persistent: true }
  );

  console.log("Sent to queue:", data._id);
};