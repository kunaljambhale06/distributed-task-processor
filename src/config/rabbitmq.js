import amqp from "amqplib";

let channel;

export const connectQueue = async () => {
  const connection = await amqp.connect("amqp://localhost");
  channel = await connection.createChannel();

  await channel.assertQueue("jobQueue");

  console.log("RabbitMQ Connected");
};

export const sendToQueue = async (data) => {
  if (!channel) throw new Error("Queue not initialized");

  channel.sendToQueue(
    "jobQueue",
    Buffer.from(JSON.stringify(data))
  );
};