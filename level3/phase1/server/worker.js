import { Worker } from "bullmq";
import Redis from "ioredis";
import sendEmail from "./lib/sendEmail.js";

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "email",
  async (job) => {
    console.log("Job started");

    const { email } = job.data;
    await sendEmail(email);

    console.log(`Email sent to ${email}`);
    console.log("Job completed");
  },
  { connection }
);