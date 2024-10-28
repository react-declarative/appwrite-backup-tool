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

const DOCUMENT_READ_DELAY = 100;

const TOTAL_DOCUMENTS_LIMIT = 100_000;
const DOCUMENTS_PAGE_SIZE = 100;

const FILE_READ_DELAY = 1_000;


const client = new sdk.Client();

client.setEndpoint(process.env.APPWRITE_ENDPOINT)
client.setProject(process.env.APPWRITE_PROJECT_ID)
client.setKey(process.env.APPWRITE_API_KEY)

if (process.env.APPWRITE_SELF_SIGNED) {
  client.setSelfSigned();
}

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

const sleep = (timeout = 1_000) => new Promise((res) => {
  setTimeout(() => {
    res();
  }, timeout);
});

const listFiles = async function* (bucketId) {
  let counter = 0;
  let lastId = null;
  while (counter < TOTAL_FILES_LIMIT) {
    console.log(`Fetching bucket ${bucketId} starting from ${lastId || 0}`)
    const { files } = await storage.listFiles(bucketId, [
      Query.limit(FILES_PAGE_SIZE),
      Query.orderDesc("$updatedAt"),
      ...(lastId ? [Query.cursorAfter(lastId)] : []),
    ]);
    await sleep(FILE_READ_DELAY);
    for (const file of files) {
      yield file;
    }
    counter += files.length;
    if (files.length < FILES_PAGE_SIZE) {
      break;
    }
    lastId = files[files.length - 1].$id;
  }
};

const listDocuments = async function* (databaseId, collectionId, queries = []) {
  queries = queries.filter((value) => !!value);
  let lastId = null;

  const createRequest = async () => {
    console.log(`Fetching collection ${collectionId} from ${collectionId} starting from ${lastId || 0}`)
    return await databases.listDocuments(
      databaseId,
      collectionId,
      [
        sdk.Query.orderDesc("$updatedAt"),
        ...(lastId ? [sdk.Query.cursorAfter(lastId)] : []),
        ...queries,
        sdk.Query.limit(DOCUMENTS_PAGE_SIZE),
      ]
    );
  };

  let counter = 0;
  let lastQuery = createRequest();

  while (counter < TOTAL_DOCUMENTS_LIMIT) {
    const [{ documents }] = await Promise.all([
      lastQuery,
      sleep(DOCUMENT_READ_DELAY),
    ]);
    for (const document of documents) {
      yield document;
    }
    if (documents.length < DOCUMENTS_PAGE_SIZE) {
      break;
    }
    lastId = documents[documents.length - 1].$id;
    lastQuery = createRequest();
    counter += documents.length;
  }
};

await fs.mkdir("backup/buckets", { recursive: true });
await fs.mkdir("backup/databases", { recursive: true });

// Backup documents
{
  const { databases: databasesList, total } = await databases.list();
  console.log(`Found ${total} databases!`);
  for (const database of databasesList) {
    const { collections, total } = await databases.listCollections(
      database.$id,
      [
        sdk.Query.limit(5_000)
      ]
    );
    console.log(`Found ${total} collections id ${database.$id}!`);
    for (const collection of collections) {
      console.log(`Making backup of ${collection.$id}`);
      await fs.mkdir(`backup/databases/${database.$id}/${collection.$id}`, {
        recursive: true,
      });
      for await (const document of listDocuments(database.$id, collection.$id)) {
        console.log(
          `Writing ${document.$id} from ${collection.$id} from ${database.$id}`
        );
        await fs.writeFile(
          `backup/databases/${database.$id}/${collection.$id}/${document.$id}.json`,
          JSON.stringify(document, null, 2)
        );
      }
    }
  }
}

// Backup files
{
  const { buckets, total } = await storage.listBuckets();
  console.log(`Found ${total} buckets!`);
  for (const bucket of buckets) {
    console.log(`Making backup of ${bucket.$id}`);
    await fs.mkdir(`backup/buckets/${bucket.$id}`, { recursive: true });
    for await (const file of listFiles(bucket.$id)) {
      const extension = path.extname(file.name);
      console.log(`Writing ${file.$id} from ${bucket.$id} ${extension ? `(${extension})` : ""}`);
      try {
        const arraybuffer = await storage.getFileView(bucket.$id, file.$id);
        const buffer= Buffer.from(new Uint8Array(arraybuffer));
        await fs.writeFile(
          `backup/buckets/${bucket.$id}/${file.$id}${extension}`,
          buffer
        );
      } catch (error) {
        console.error(error);
        console.log(`Error writing ${file.$id} from ${bucket.$id} ${extension ? `(${extension})` : ""}`);
      } finally {
        await sleep(FILE_READ_DELAY);
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
      console.log(`${file} is broken!`);
    }
  }
  if (isOk) {
    console.log("Everything is OK");
  }
}
