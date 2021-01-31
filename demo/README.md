## Installation
```bash
npm run clean
npm install
npm run build
```

## Run seeder server
prepare a sample.mp4 in the 'packages/webtorrentx-paid/data' directory.
then:
```bash
cd packages/webtorrentx-paid
# use the appropiate .env file
npm run stat-seeder
```

## Run leecher client ui
```bash
cd packages/client-ui
# use the appropiate .env file
npm run start
```

then access [http://localhost:3000](http://localhost:3000)
