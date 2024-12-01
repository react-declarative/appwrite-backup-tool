import sdk from "node-appwrite";

import Module from "module";
import dotenv from "dotenv";
import { existsSync } from "fs";
import fs from "fs/promises";
import { glob } from "glob";
import path from "path";

const require = Module.createRequire(import.meta.url);

const HAS_COLLECTION_ATTRIBUTE = (collectionId, attributeKey) => {
  const collection = schema.collections.find(
    (item) => item.$id === collectionId
  );
  if (!collection) {
    return false;
  }
  const attribute = collection.attributes.find(
    (item) => item.key === attributeKey
  );
  return !!attribute;
};

if (!existsSync(".env")) {
  console.log("Missing .env file. Please use .env.example as a template");
  process.exit(-1);
}

const schema = require(path.join(process.cwd(), "./appwrite.json"));
const entries = process.argv.slice(2);

if (!entries.length) {
  throw new Error("collection list not provided");
}

const FIND_COLLECTION = (name) => {
  const collection = schema.collections.find((item) => item.name === name);
  if (!collection) {
    throw new Error(`collection not found name=${name}`);
  }
  return collection;
};

dotenv.config();

const DOCUMENT_WRITE_DELAY = 1;

const client = new sdk.Client();

client.setEndpoint(process.env.APPWRITE_ENDPOINT);
client.setProject(process.env.APPWRITE_PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

if (process.env.APPWRITE_SELF_SIGNED) {
  client.setSelfSigned();
}

const databases = new sdk.Databases(client);

const tryRead = async (databaseId, collectionId, documentId) => {
  try {
    return await databases.getDocument(databaseId, collectionId, documentId);
  } catch {
    return null;
  }
};

const writeTransform = (data, collectionId) => {
  const userEntries = Object.entries(data)
    .filter(([key]) => !key.startsWith("$"))
    .filter(([key]) => {
      const hasAttribute = HAS_COLLECTION_ATTRIBUTE(collectionId, key);
      if (!hasAttribute) {
        console.log(`SKIP ATTRIBUTE key=${key} collection=${collectionId}`);
      }
      return hasAttribute;
    })
  return Object.fromEntries(userEntries);
};

const sleep = (timeout = 1_000) =>
  new Promise((res) => {
    setTimeout(() => {
      res();
    }, timeout);
  });

await fs.mkdir("backup/databases", { recursive: true });

{
  const { databases: databasesList, total } = await databases.list();
  console.log(`Found ${total} databases!`);
  for (const database of databasesList) {
    const collections = entries.map(FIND_COLLECTION);
    console.log(`Found ${collections.length} collections id ${database.$id}!`);
    for (const collection of collections) {
      const databaseFiles = await glob(
        `backup/databases/*/${collection.$id}/*.json`,
        {
          withFileTypes: true,
          stat: true,
        },
      );
      databaseFiles.sort((a, b) => a.mtime - b.mtime);
      console.log(
        `Found ${databaseFiles.length} collection ${collection.$id} documents`,
      );
      for (const fileRef of databaseFiles) {
        const file = fileRef.fullpathPosix();
        const text = await fs.readFile(file);
        const data = JSON.parse(text);
        const { $id, $databaseId, $collectionId } = data;
        console.log(
          `Uploading ${$id} from ${$collectionId} from ${$databaseId}`,
        );
        try {
          const prevDocument = await tryRead($databaseId, $collectionId, $id);
          if (prevDocument) {
            await databases.updateDocument(
              $databaseId,
              $collectionId,
              $id,
              writeTransform(data, $collectionId),
            );
            continue;
          }
          await databases.createDocument(
            $databaseId,
            $collectionId,
            $id,
            writeTransform(data, $collectionId),
          );
        } finally {
          await sleep(DOCUMENT_WRITE_DELAY);
        }
      }
    }
  }
}
