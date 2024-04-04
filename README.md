# appwrite-backup-tool

> Minimalistic Appwrite schema dumper with data backup, restore features

This backup tool will generate query for each document in AppWrite database and save them as a json files on a hard drive. That means It can handle as much documents as you need. Also there is a script to run AppWrite in Docker on localhost so you can test your backup. Build on top of [AsyncGenerator API](https://javascript.info/async-iterators-generators)

<a href="https://cloud.appwrite.io/card/64b53d046c81edba0b1a">
	<img width="350" src="https://cloud.appwrite.io/v1/cards/cloud?userId=64b53d046c81edba0b1a" alt="Appwrite Cloud Card" />
</a>

Got a question? Feel free to [ask It in issues](https://github.com/react-declarative/appwrite-backup-tool/issues), I need traffic

## Setup

1. Install [Appwrite CLI](https://appwrite.io/docs/command-line) and login

> Windows

```powershell
npm install -g appwrite-cli
Set-ExecutionPolicy RemoteSigned # In PowerShell as Administrator
appwrite client --endpoint https://cloud.appwrite.io/v1
appwrite login
```

> Linux

```bash
sudo npm config set unsafe-perm true
sudo npm install -g appwrite-cli
appwrite client --endpoint https://cloud.appwrite.io/v1
appwrite login
```

2. [BACKUP, RESTORE] Write `.env` config in the root (`/appwrite-backup-tool-main/.env`) by using [.env.example](./.env.example)

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=64b53d0c41fcf5093b12
APPWRITE_API_KEY=****
APPWRITE_SELF_SIGNED=1
```

3. [RESTORE] Copy `appwrite.json` to the root (collections schema). See [https://appwrite.io/docs/tooling/command-line/deployment](https://appwrite.io/docs/tooling/command-line/deployment)

## Usage

### Data backup and restore

- Backup all [Databases](https://appwrite.io/docs/databases) and [Buckets](https://appwrite.io/docs/storage)

> Crossplatform

```bash
npx -y rimraf backup
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

### Schema DIFF

 - Show changed collection attributes by comparing `appwrite.json` and `appwrite.prev.json`

> Crossplatform

```bash
npm run appwrite:diff
```

 - Output

```text

...

COLLECTION APARTMENT
ADD rent_kom_menedzher_unit
ADD rent_kom_agency_unit
ADD rent_kom_kommisiya_agenstva
CHANGED rent_kom_czena_sobstvennika_valyuta (array true -> false)
CHANGED rent_kom_komissiya_agenstva_unit (array true -> false)

...

```

### Other

 - Run AppWrite with [Docker Compose](https://docs.docker.com/compose/)

> Windows

```cmd
npx -y open-cli http://localhost:8080/
npm run appwrite:start:windows
```

> Linux

```bash
npx -y open-cli http://localhost:8080/
npm run appwrite:start
```

 - Authorize CLI in Docker AppWrite instance

> Crossplatform

```bash
appwrite client --selfSigned true --endpoint http://localhost:8080/v1
appwrite login
```

 - Start AppWrite self-hosted instance (after `.env` changed)

```bash
docker-compose up -d --remove-orphans --renew-anon-volumes
```

 - Stop AppWrite self-hosted instance

```bash
docker-compose down
```

 - Uninstall AppWrite by removing all volumes and containers (clean install). Also remove networks to avoid mariadb DNS lookup error when downgrade from higher version of AppWrite to lower

```bash
docker stop $(docker ps --filter status=running -q)
docker rm $(docker ps -aq)
docker volume rm $(docker volume ls -q --filter dangling=true)
docker rmi $(docker images -a -q)
docker network prune --force --filter until=1s
```

## Moving Appwrite from one machine to another

1. Install [docker-volume-snapshot](https://github.com/junedkhatri31/docker-volume-snapshot)

```bach
sudo curl -SL https://raw.githubusercontent.com/junedkhatri31/docker-volume-snapshot/main/docker-volume-snapshot -o /usr/local/bin/docker-volume-snapshot
sudo chmod +x /usr/local/bin/docker-volume-snapshot
```

2. List volumes and export them

```bash
docker volume list
# appwrite_appwrite-builds
# appwrite_appwrite-cache
# appwrite_appwrite-certificates
# appwrite_appwrite-config
# appwrite_appwrite-functions
# appwrite_appwrite-influxdb
# appwrite_appwrite-mariadb
# appwrite_appwrite-redis
# appwrite_appwrite-uploads
```

3. Export volumes from current machine

```bash
docker-volume-snapshot create appwrite_appwrite-builds appwrite_appwrite-builds.tar
docker-volume-snapshot create appwrite_appwrite-cache appwrite_appwrite-cache.tar
docker-volume-snapshot create appwrite_appwrite-certificates appwrite_appwrite-certificates.tar
docker-volume-snapshot create appwrite_appwrite-config appwrite_appwrite-config.tar
docker-volume-snapshot create appwrite_appwrite-functions appwrite_appwrite-functions.tar
docker-volume-snapshot create appwrite_appwrite-influxdb appwrite_appwrite-influxdb.tar
docker-volume-snapshot create appwrite_appwrite-mariadb appwrite_appwrite-mariadb.tar
docker-volume-snapshot create appwrite_appwrite-redis appwrite_appwrite-redis.tar
docker-volume-snapshot create appwrite_appwrite-uploads appwrite_appwrite-uploads.tar
```

4. Share volumes from current machine by using web server and [ngrok](https://www.npmjs.com/package/ngrok)

```bash
python3 -m http.server 9999
# ngrok http 9999
```

5. Download volumes on another machine

```bash
wget http://192.168.1.131:9999/appwrite_appwrite-builds.tar
wget http://192.168.1.131:9999/appwrite_appwrite-cache.tar
wget http://192.168.1.131:9999/appwrite_appwrite-certificates.tar
wget http://192.168.1.131:9999/appwrite_appwrite-config.tar
wget http://192.168.1.131:9999/appwrite_appwrite-functions.tar
wget http://192.168.1.131:9999/appwrite_appwrite-influxdb.tar
wget http://192.168.1.131:9999/appwrite_appwrite-mariadb.tar
wget http://192.168.1.131:9999/appwrite_appwrite-redis.tar
wget http://192.168.1.131:9999/appwrite_appwrite-uploads.tar
```

6. Initialize appwrite volumes by starting with docker-compose on another machine and immediately stoping it

```bash
docker-compose up
```

wait for docker images download and <kbd>Ctrl</kbd> + <kbd>C</kbd> to shutdown appwrite instance

7. Import volumes data

```bash
docker-volume-snapshot restore appwrite_appwrite-builds.tar appwrite_appwrite-builds
docker-volume-snapshot restore appwrite_appwrite-cache.tar appwrite_appwrite-cache
docker-volume-snapshot restore appwrite_appwrite-certificates.tar appwrite_appwrite-certificates
docker-volume-snapshot restore appwrite_appwrite-config.tar appwrite_appwrite-config
docker-volume-snapshot restore appwrite_appwrite-functions.tar appwrite_appwrite-functions
docker-volume-snapshot restore appwrite_appwrite-influxdb.tar appwrite_appwrite-influxdb
docker-volume-snapshot restore appwrite_appwrite-mariadb.tar appwrite_appwrite-mariadb
docker-volume-snapshot restore appwrite_appwrite-redis.tar appwrite_appwrite-redis
docker-volume-snapshot restore appwrite_appwrite-uploads.tar appwrite_appwrite-uploads
```

8. Start appwrite again

```bash
docker-compose up -d --remove-orphans --renew-anon-volumes
```

9. [Optional] Follow the appwrite [upgrade guide](https://appwrite.io/docs/advanced/self-hosting/update)

```bash
# parent_directory <= you run the command in this directory
# └── appwrite
#     └── docker-compose.yml

docker run -it --rm \
    --volume /var/run/docker.sock:/var/run/docker.sock \
    --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
    --entrypoint="upgrade" \
    appwrite/appwrite:1.5.4

# appwrite <= navigate to the appwrite directory
# └── docker-compose.yml

cd appwrite/
docker compose exec appwrite migrate
```

## See also

Looks like AppWrite file endpoint is limited `to 60 requests in every 1 minutes per IP address`. So [I added a delay](./scripts/restore.mjs), you can change it If you need to

> Quite usefull when `AppwriteException [Error]: The document data is missing. Try again with document data populated`...

```javascript
const DOCUMENT_WRITE_DELAY = 1500;
const FILE_UPLOAD_DELAY = 2_000;
```
