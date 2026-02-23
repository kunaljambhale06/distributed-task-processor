import amqp from "amqplib";

let channel;

export const connectQueue = async () => {
    const connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();

    await channel.assertQueue("task_queue", { durable: true });

    console.log(" RabbitMQ Connected");
};

export const sendToQueue = (message) => {
    channel.sendToQueue(
        "task_queue",
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
    );
};