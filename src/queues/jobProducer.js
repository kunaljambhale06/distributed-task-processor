import { sendToQueue } from "./config/rabbitmq.js";

for (let i = 0; i < 100; i++) {
  await sendToQueue({ id: i, task: "Process Job" });
}