# appwrite-backup-tool

> Minimalistic Appwrite schema dumper with data backup and restore features

<a href="https://cloud.appwrite.io/card/64b53d046c81edba0b1a">
	<img width="350" src="https://cloud.appwrite.io/v1/cards/cloud?userId=64b53d046c81edba0b1a" alt="Appwrite Cloud Card" />
</a>

## Setup

1. Install [Appwrite CLI](https://appwrite.io/docs/command-line) and login

> Windows

```cmd
npm install -g appwrite-cli
Set-ExecutionPolicy RemoteSigned
appwrite client --endpoint https://cloud.appwrite.io/v1
appwrite login
```

> Linux

```bash
npm install -g appwrite-cli
appwrite client --endpoint https://cloud.appwrite.io/v1
appwrite login
```

2. Write `.env` config by using [.env.example](./.env.example)

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=64b53d0c41fcf5093b12
APPWRITE_API_KEY=****
```

## Usage

### Data backup and restore

- Backup all [Databases](https://appwrite.io/docs/databases) and [Buckets](https://appwrite.io/docs/storage)

> Crossplatform

```bash
npm run appwrite:backup
```

- Deploy all local data to AppWrite server (clear installation is optional but recommended)

> Crossplatform

```bash
npm run appwrite:restore
```

### Schema backup and restore

 - Dump currend DB schema

> Windows

```cmd
npm run appwrite:fetch:windows
```

> Linux

```bash
npm run appwrite:fetch
```

 - Push new DB schema to AppWrite instance

> Windows

```cmd
npm run appwrite:push:windows
```

> Linux

```bash
npm run appwrite:push
```

### Other

 - Run AppWrite with [Docker Compose](https://docs.docker.com/compose/)

> Windows

```cmd
npm run appwrite:start:windows
```

> Linux

```bash
npm run appwrite:start
```
