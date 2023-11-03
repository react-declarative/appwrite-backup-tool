import dotenv from "dotenv";
import { existsSync } from "fs";
import fs from "fs/promises";
import { glob } from "glob";
import sdk from "node-appwrite";

if (!existsSync(".env")) {
  console.log("Missing .env file. Please use .env.example as a template");
  process.exit(-1);
}

dotenv.config();

const USER_DATABASE_ID = '64c4de8e7b30179809ef';
const USER_COLLECTION_ID = '64c4fb401e0a490e44bf';

const DEFAULT_PASSWORD = 'alpine';

const client = new sdk.Client();

client.setEndpoint(process.env.APPWRITE_ENDPOINT)
client.setProject(process.env.APPWRITE_PROJECT_ID)
client.setKey(process.env.APPWRITE_API_KEY)

if (process.env.APPWRITE_SELF_SIGNED) {
  client.setSelfSigned();
}

const sleep = (timeout = 1_000) => new Promise((res) => {
  setTimeout(() => {
    res();
  }, timeout);
});

const users = new sdk.Users(client);

const tryRead = async (userId) => {
    try {
      return await users.get(userId);
    } catch {
      return null;
    }
};

await fs.mkdir("backup/databases", { recursive: true });

{
    const usersFiles = await glob(`backup/databases/${USER_DATABASE_ID}/${USER_COLLECTION_ID}/*.json`);
    console.log(`Found ${usersFiles.length} user records`);
    for (const file of usersFiles) {
      const text = await fs.readFile(file);
      const data = JSON.parse(text);
      const { $id, email, phone } = data;
      if (await tryRead($id)) {
        console.log(`User ${$id} exist (${email})`);
        continue;
      }
      console.log(`Creating ${$id} exist (${email})`);
      await users.create($id, email, phone, DEFAULT_PASSWORD);
      await sleep(1_000);
    }
}
