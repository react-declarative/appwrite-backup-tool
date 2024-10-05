import Module from "module";
import dotenv from "dotenv";
import { existsSync } from "fs";
import path from "path";
import sdk from "node-appwrite";

const require = Module.createRequire(import.meta.url);

const schema = require(path.join(process.cwd(), "./appwrite.json"));
const entries = process.argv.slice(2);

if (!existsSync(".env")) {
  console.log("Missing .env file. Please use .env.example as a template");
  process.exit(-1);
}

dotenv.config();

const SHOULD_COLLECTION = (name) => {
    if (!entries.length) {
        return true;
    }
    return entries.includes(name);
};

const GET_COLLECTION = (id) => {
    const collection = schema.collections.find((item) => item.$id === id);
    if (!collection) {
      throw new Error(`collection not found: ${id}`);
    }
    return collection;
};

const GET_DATABASE_ID = () => {
    const databese = schema.databases[0];
    if (!databese) {
      throw new Error(`database not found: ${id}`);
    }
    return databese.$id;
};

const DATABASE_ID = GET_DATABASE_ID();

const client = new sdk.Client();
const databases = new sdk.Databases(client);

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


for (const collectionId of schema.collections.map(({ $id }) => $id)) {
    
    const { attributes, name } = GET_COLLECTION(collectionId);

    const hasCollection = async () => {
        try {
            return await databases.getCollection(DATABASE_ID, collectionId)
        } catch {
            return null
        }
    };

    const hasAttribute = async (key) => {
        try {
            return await databases.getAttribute(DATABASE_ID, collectionId, key)
        } catch {
            return null
        }
    };

    if (!SHOULD_COLLECTION(name)) {
        continue
    }

    if (await hasCollection()) {
        console.log(`Found collection id=${collectionId} name=${name}`);
    } else {
        console.log(`Creating collection id=${collectionId} name=${name}`);
        await databases.createCollection(DATABASE_ID, collectionId, name, [
            sdk.Permission.create(sdk.Role.users()),
            sdk.Permission.read(sdk.Role.users()),
            sdk.Permission.update(sdk.Role.users()),
        ]);
    }

    for (const { key, type, required, array, size } of attributes) {
        if (await hasAttribute(key)) {
            console.log(`skip  ${key}: type=${type} array=${array} size=${size}`)
            await sleep(1_500);
            continue;
        } else {
            console.log(`creating  ${key}: type=${type} array=${array} size=${size}`)
        }
        if (type === "string") {
            await databases.createStringAttribute(DATABASE_ID, collectionId, key, size, required, undefined, array);
        }
        if (type === "boolean") {
            await databases.createBooleanAttribute(DATABASE_ID, collectionId, key, required, undefined, array);
        }
        if (type === "integer") {
            await databases.createIntegerAttribute(DATABASE_ID, collectionId, key, required, undefined, undefined, undefined, array);
        }
        await sleep(1_500);
    }
}
