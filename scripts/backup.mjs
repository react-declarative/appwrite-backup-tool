import sdk, { Query } from "node-appwrite";

import dotenv from "dotenv";
import { existsSync } from 'fs';
import fs from "fs/promises";
import { glob } from "glob";
import path from "path";

if (!existsSync(".env")) {
  console.log("Missing .env file. Please use .env.example as a template");
  process.exit(-1);
}

dotenv.config();

const TOTAL_FILES_LIMIT = 100_000;
const FILES_PAGE_SIZE = 100;

const TOTAL_DOCUMENTS_LIMIT = 100_000;
const DOCUMENTS_PAGE_SIZE = 100;

const client = new sdk.Client();

client
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)
  .setSelfSigned();

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

const listFiles = async (bucketId) => {
  const result = [];
  let lastId = null;
  while (result.length <= TOTAL_FILES_LIMIT) {
    const { files } = await storage.listFiles(bucketId, [
      Query.limit(FILES_PAGE_SIZE),
      Query.orderDesc("$updatedAt"),
      ...(lastId ? [Query.cursorAfter(lastId)] : []),
    ]);
    for (const file of files) {
      result.push(file);
    }
    if (files.length < FILES_PAGE_SIZE) {
      break;
    }
    lastId = files[files.length - 1].$id;
  }
  return result;
};

const listDocuments = async (databaseId, collectionId) => {
  const result = [];
  let lastId = null;
  while (result.length <= TOTAL_DOCUMENTS_LIMIT) {
    const { documents } = await databases.listDocuments(
      databaseId,
      collectionId,
      [
        Query.limit(DOCUMENTS_PAGE_SIZE),
        Query.orderDesc("$updatedAt"),
        ...(lastId ? [Query.cursorAfter(lastId)] : []),
      ]
    );
    for (const document of documents) {
      result.push(document);
    }
    if (documents.length < DOCUMENTS_PAGE_SIZE) {
      break;
    }
    lastId = documents[documents.length - 1].$id;
  }
  return result;
};

await fs.mkdir("backup/buckets", { recursive: true });
await fs.mkdir("backup/databases", { recursive: true });

{
  const { buckets, total } = await storage.listBuckets();

  console.log(`Found ${total} buckets!`);

  for (const bucket of buckets) {
    console.log(`Getting list of files in ${bucket.$id}`);
    const files = await listFiles(bucket.$id);
    console.log(`Making backup of ${bucket.$id}`);
    await fs.mkdir(`backup/buckets/${bucket.$id}`, { recursive: true });
    for (const file of files) {
      const metadata = await storage.getFile(bucket.$id, file.$id);
      const extension = path.extname(metadata.name);
      console.log(`Writing ${file.$id}${extension} from ${bucket.$id}`);
      const buffer = await storage.getFileView(bucket.$id, file.$id);
      await fs.writeFile(
        `backup/buckets/${bucket.$id}/${file.$id}${extension}`,
        buffer
      );
    }
  }
}

{
  const { databases: databasesList, total } = await databases.list();
  console.log(`Found ${total} databases!`);
  for (const database of databasesList) {
    const { collections, total } = await databases.listCollections(
      database.$id
    );
    console.log(`Found ${total} collections id ${database.$id}!`);
    for (const collection of collections) {
      console.log(`Getting list of documents in ${collection.$id}`);
      const documents = await listDocuments(database.$id, collection.$id);
      console.log(`Making backup of ${collection.$id}`);
      await fs.mkdir(`backup/databases/${database.$id}/${collection.$id}`, {
        recursive: true,
      });
      for (const document of documents) {
        const data = await databases.getDocument(
          database.$id,
          collection.$id,
          document.$id
        );
        console.log(
          `Writing ${document.$id} from ${collection.$id} from ${database.$id}`
        );
        await fs.writeFile(
          `backup/databases/${database.$id}/${collection.$id}/${document.$id}.json`,
          JSON.stringify(data, null, 2)
        );
      }
    }
  }
}

{
  console.log("Checking backup consistence...");
  const databaseFiles = await glob(`backup/databases/*/*/*.json`);
  let isOk = true;
  for (const file of databaseFiles) {
    try {
      JSON.parse(await fs.readFile(file));
    } catch {
      isOk = false;
      console.log(`${path} is broken!`);
    }
  }
  if (isOk) {
    console.log("Everything is OK");
  }
}
