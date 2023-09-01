import sdk, { AppwriteException, InputFile } from "node-appwrite";

import dotenv from "dotenv";
import { existsSync } from "fs";
import fs from "fs/promises";
import { glob } from "glob";
import path from "path";

if (!existsSync(".env")) {
  console.log("Missing .env file. Please use .env.example as a template");
  process.exit(-1);
}

dotenv.config();

const DOCUMENT_WRITE_DELAY = 100;
const FILE_UPLOAD_DELAY = 2_000;

const client = new sdk.Client();

client.setEndpoint(process.env.APPWRITE_ENDPOINT)
client.setProject(process.env.APPWRITE_PROJECT_ID)
client.setKey(process.env.APPWRITE_API_KEY)

if (process.env.APPWRITE_SELF_SIGNED) {
  client.setSelfSigned();
}

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

const writeTransform = (data) => {
  const userEntries = Object.entries(data)
    .filter(([key]) => !key.startsWith("$"));
  return Object.fromEntries(userEntries);
};

const sleep = (timeout = 1_000) => new Promise((res) => {
  setTimeout(() => {
    res();
  }, timeout);
});

const tryRead = async (databaseId, collectionId, documentId) => {
  try {
    return await databases.getDocument(databaseId, collectionId, documentId);
  } catch {
    return null;
  }
};

const isFileExist = async (bucketId, fileId) => {
  try {
    await storage.getFile(bucketId, fileId);
    return true;
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      return false;
    }
    throw error;
  }
};

await fs.mkdir("backup/buckets", { recursive: true });
await fs.mkdir("backup/databases", { recursive: true });

// Restore documents
{
  const databaseFiles = await glob(`backup/databases/*/*/*.json`);
  console.log(`Found ${databaseFiles.length} collection documents`);
  for (const file of databaseFiles) {
    const text = await fs.readFile(file);
    const data = JSON.parse(text);
    const { $id, $databaseId, $collectionId } = data;
    console.log(`Uploading ${$id} from ${$collectionId} from ${$databaseId}`);
    try {
      const prevDocument = await tryRead($databaseId, $collectionId, $id);
      if (prevDocument) {
        const currentUpdateAt = Number(new Date(prevDocument.$updatedAt));
        const pendingUpdateAt = Number(new Date(data.$updatedAt));
        if (currentUpdateAt >= pendingUpdateAt) {
          console.log(`Document ${$id} outdated, patching`);
          await databases.updateDocument($databaseId, $collectionId, $id, writeTransform(data));
        }
        continue
      }
      await databases.createDocument($databaseId, $collectionId, $id, writeTransform(data));
    } finally {
      await sleep(DOCUMENT_WRITE_DELAY);
    }
  }
}

// Restore files
{
  const buckets = await glob(`backup/buckets/*`);
  console.log(`Found ${buckets.length} buckets`);
  for (const bucket of buckets) {
    const bucketId = path.basename(bucket);
    const files = await glob(`backup/buckets/${bucketId}/*`);
    console.log(`Found ${files.length} files in ${bucketId}`);
    for (const file of files) {
      const fileName = path.basename(file);
      const fileId = fileName.slice(0, fileName.length - path.extname(fileName).length);
      console.log(`Uploading ${fileId} from ${bucketId}`);
      try {
        if (await isFileExist(bucketId, fileId)) {
          console.log(`File ${fileId} ${bucketId} exist, skip`);
          continue;
        }
        await storage.createFile(bucketId, fileId, InputFile.fromPath(file, fileName)); 
      } finally {
        await sleep(FILE_UPLOAD_DELAY);
      }
    }
  }
}
