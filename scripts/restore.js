import dotenv from "dotenv";
import { existsSync } from 'fs';
import fs from "fs/promises";
import { glob } from "glob";
import path from "path";
import sdk from "node-appwrite";

if (!existsSync(".env")) {
  console.log("Missing .env file. Please use .env.example as a template");
  process.exit(-1);
}

dotenv.config();

const client = new sdk.Client();

client
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)
  .setSelfSigned();

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

await fs.mkdir("backup/buckets", { recursive: true });
await fs.mkdir("backup/databases", { recursive: true });
