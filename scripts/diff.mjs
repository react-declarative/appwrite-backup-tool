import Module from "node:module";
import path from "node:path";

const require = Module.createRequire(import.meta.url);

const pendingSchema = require(path.join(process.cwd(), "./appwrite.json"));
const prevSchema = require(path.join(process.cwd(), "./appwrite.prev.json"));

for (const { name, attributes } of pendingSchema.collections) {
  console.log(`COLLECTION ${name}`);

  let isNothingFound = true;

  const prevCollection = prevSchema.collections.find(
    (item) => item.name === name
  );

  if (!prevCollection) {
    console.log('not exist');
    console.log('');
    continue;
  }

  const { attributes: prevAttributes } = prevCollection;

  const currentAttributesSet = new Set(attributes.map(({ key }) => key));
  const prevAttributesSet = new Set(prevAttributes.map(({ key }) => key));

  for (const item of [...currentAttributesSet]) {
    if (!prevAttributesSet.has(item)) {
      const { type, size, array, required, default: D } = attributes.find(({ key }) => key === item);
      console.log(`ADD ${item} type=${type} size=${size || ""} array=${array} required=${required} default=${D}`);
      isNothingFound = false;
    }
  }

  for (const item of [...prevAttributesSet]) {
    if (!currentAttributesSet.has(item)) {
      console.log(`REMOVE ${item}`);
      isNothingFound = false;
    }
  }

  for (const item of attributes) {
    const prevItem = prevAttributes.find(({ key }) => key === item.key);
    if (!prevItem) {
      continue;
    }
    if (item.type !== prevItem.type) {
      console.log(`CHANGED ${item.key} (type ${prevItem.type} -> ${item.type})`);
      isNothingFound = false;
    }
    if (item.required !== prevItem.required) {
      console.log(`CHANGED ${item.key} (required ${prevItem.required} -> ${item.required})`);
      isNothingFound = false;
    }
    if (item.array !== prevItem.array) {
      console.log(`CHANGED ${item.key} (array ${prevItem.array} -> ${item.array})`);
      isNothingFound = false;
    }
    if (item.size !== prevItem.size) {
      console.log(`CHANGED ${item.key} (size ${prevItem.size} -> ${item.size})`);
      isNothingFound = false;
    }
    if (item.default !== prevItem.default) {
      console.log(`CHANGED ${item.key} (default ${prevItem.default} -> ${item.default})`);
      isNothingFound = false;
    }
  }

  if (isNothingFound) {
    console.log('nothing found...');
  }
  console.log('');
}
