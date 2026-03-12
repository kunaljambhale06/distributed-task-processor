import amqp from "amqplib";

let channel;

export const connectQueue = async () => {
  const connection = await amqp.connect("amqp://localhost");

  channel = await connection.createChannel();

<<<<<<< HEAD
  // ✅ Declare with SAME config as worker
  await channel.assertQueue("jobs", {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": "failed_jobs"
    }
=======
  await channel.assertQueue("jobQueue", {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": "failed_jobs",
    },
  });

  await channel.assertQueue("failed_jobs", {
    durable: true,
>>>>>>> 6ea9e80 (updated DLQ logic for retries and failure)
  });

  console.log("RabbitMQ Connected");
};

export const sendToQueue = async (data) => {
  channel.sendToQueue(
    "jobs",
    Buffer.from(JSON.stringify(data)),
    { persistent: true }
  );

  console.log("Sent to queue:", data._id);
};