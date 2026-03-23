import { createClient } from "redis";
const host = process.env.REDIS_HOST || "127.0.0.1";
const client = createClient({
  socket: {
    host,
    port: 6379,
  },
});

client.connect();

export default client;
