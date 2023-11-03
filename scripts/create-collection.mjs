import dotenv from "dotenv";
import { existsSync } from "fs";
import Module from "module";
import path from "path";
import sdk from "node-appwrite";

const require = Module.createRequire(import.meta.url);

const schema = require(path.join(process.cwd(), "./appwrite.json"));

if (!existsSync(".env")) {
  console.log("Missing .env file. Please use .env.example as a template");
  process.exit(-1);
}

dotenv.config();

const GET_COLLECTION = (id) => {
    const collection = schema.collections.find((item) => item.$id === id);
    if (!collection) {
      throw new Error(`collection not found: ${id}`);
    }
    return collection;
};

const DATABASE_ID = '64c4de8e7b30179809ef';
const COLLECTION_ID = '64c4fb401e0a490e44bf';

const client = new sdk.Client();
const databases = new sdk.Databases(client);

client.setEndpoint(process.env.APPWRITE_ENDPOINT)
client.setProject(process.env.APPWRITE_PROJECT_ID)
client.setKey(process.env.APPWRITE_API_KEY)

if (process.env.APPWRITE_SELF_SIGNED) {
    client.setSelfSigned();
}

const hasCollection = async () => {
    try {
        return await databases.getCollection(DATABASE_ID, COLLECTION_ID)
    } catch {
        return null
    }
}

const sleep = (timeout = 1_000) => new Promise((res) => {
    setTimeout(() => {
      res();
    }, timeout);
});

const { attributes, name } = GET_COLLECTION(COLLECTION_ID);

{
    if (!(await hasCollection())) {
        await databases.createCollection(DATABASE_ID, COLLECTION_ID, name);
    }
    for (const { key, type, required, array, size } of attributes) {
        console.log(`creating  ${key}: type=${type} array=${array} size=${size}`)
        if (type === "string") {
            await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, key, size, required, undefined, array);
        }
        if (type === "boolean") {
            await databases.createBooleanAttribute(DATABASE_ID, COLLECTION_ID, key, required, undefined, array);
        }
        if (type === "integer") {
            await databases.createIntegerAttribute(DATABASE_ID, COLLECTION_ID, key, required)
        }
        await sleep(1_000);
    }
}
