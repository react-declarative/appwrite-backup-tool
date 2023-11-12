import fs from "fs/promises";
import { glob } from "glob";
import path from "path";

const DATABASE_ID = "64c4de8e7b30179809ef";
const COLLECTION_ID = "64d4a5782854ff66e9a1";

const databaseFiles = await glob(
  `backup/databases/${DATABASE_ID}/${COLLECTION_ID}/*.json`
);

const PROD_KOM_ENTRIES = [
  "prod_kom_startovaya_czena",
  "prod_kom_czena_sobstvennika",
  "prod_kom_komissiya_agenstva",
  "prod_kom_komissiya_menedzhera",
  "prod_kom_startovaya_czena_valyuta",
  "prod_kom_komissiya_agenstva_unit",
  "prod_kom_komissiya_menedzhera_unit",
];

const PROD_ENTRIES = [
  "prod_startovaya_czena",
  "prod_czena_sobstvennika",
  "prod_komissiya_agenstva",
  "prod_komissiya_menedzhera",
  "prod_startovaya_czena_valyuta",
  "prod_komissiya_agenstva_unit",
  "prod_komissiya_menedzhera_unit",
];

const RENT_KOM_ENTRIES = [
  "rent_kom_startovaya_czena",
  "rent_kom_czena_sobstvennika",
  "rent_kom_komissiya_agenstva",
  "rent_kom_komissiya_menedzhera",
  "rent_kom_startovaya_czena_valyuta",
  "rent_kom_komissiya_agenstva_unit",
  "rent_kom_komissiya_menedzhera_unit",
];

const RENT_ENTRIES = [
  "rent_startovaya_czena",
  "rent_czena_sobstvennika",
  "rent_komissiya_agenstva",
  "rent_komissiya_menedzhera",
  "rent_startovaya_czena_valyuta",
  "rent_komissiya_agenstva_unit",
  "rent_komissiya_menedzhera_unit",
];

const TOTAL_PROD_ENTRIES = [
    ...PROD_ENTRIES,
    ...PROD_KOM_ENTRIES,
];

const TOTAL_RENT_ENTRIES = [
    ...RENT_ENTRIES,
    ...RENT_KOM_ENTRIES,
];

const patchApartmentPriceEntries = (apartment) => {
  const result = { ...apartment };
  {
    const system_prod_price_entries = [];
    TOTAL_PROD_ENTRIES.forEach((entry) => {
      console.log(entry)
      system_prod_price_entries.push(apartment[entry] || "");
      result[entry] = undefined;
    });
    if (!result.system_prod_price_entries) {
      result.system_prod_price_entries = system_prod_price_entries;
    }
  }
  {
    const system_rent_price_entries = [];
    TOTAL_RENT_ENTRIES.forEach((entry) => {
      system_rent_price_entries.push(apartment[entry] || "");
      result[entry] = undefined;
    });
    if (!result.system_rent_price_entries) {
      result.system_rent_price_entries = system_rent_price_entries;
    }
  }
  return result;
};

for (const file of databaseFiles) {
  const text = await fs.readFile(file);
  let data = JSON.parse(text);
  const id = data.$id;
  data = patchApartmentPriceEntries(data);
  console.log(data.system_prod_price_entries)
  data = JSON.stringify(data, null , 2);
  await fs.writeFile(path.join(`backup/databases/${DATABASE_ID}/${COLLECTION_ID}/${id}.json`), data)
}
