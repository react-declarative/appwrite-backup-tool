# Introduction

> Link to [the discord thread](https://discord.com/channels/564160730845151244/870536298220367902/1207985484333318184)

Hey guys! Thanks for amazing job. We are using AppWrite in production and everything works well. 

We are deploying separate AppWrite Docker instance for each client. So we need to diff changed between two appwrite.json configs to update installations one-by-one. The default migration tool is awful: It stucks, It can't export json-per-document backup, It can't show changes in collection schemas, It can't download all files from buckets

So I wrote [a useful set of scripts](https://github.com/react-declarative/appwrite-backup-tool/) which able to 

1. Show changes between two schemas: `appwrite.json` and `appwrite.prev.json`

```
npm run appwrite:diff

...

COLLECTION APARTMENT
ADD rent_kom_menedzher_unit
ADD rent_kom_agency_unit
ADD rent_kom_kommisiya_agenstva
CHANGED rent_kom_czena_sobstvennika_valyuta (array true -> false)
CHANGED rent_kom_komissiya_agenstva_unit (array true -> false)
```

2. Backup all collections data into `*.json` files. Bucket files backup also supported

```
npm run appwrite:backup
```

3. Restore collection items and files from buckets

```
npm run appwrite:restore
```

4. Deploy large collections [with more than 200 attributes](https://github.com/appwrite/appwrite/issues/6915). Still not fixed in appwrite-cli

```
npm run appwrite:create-collection
``` 

5. Create multiple users with preset password

```
npm run appwrite:create-users
```

All these scripts are used in our CI/CD. Without them, dev/prod releases are impossible. I propose a breaking change refactor for appwrite cloud migrations which must be rebuild on top of my tool cause It solve the problem of DevOps while working with multiple development and production environments. Do you have any opinion about it?

https://github.com/react-declarative/appwrite-backup-tool/
