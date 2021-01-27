import WebTorrentX from './lib/client';
import {TorrentX} from './lib/torrent';

async function main() {
  const magnetURI = 'magnet:?xt=urn:btih:3ed0ed882486762b9e595b9d0ced28d6c1f1faa3&dn=sintel.mp4';

  const client = new WebTorrentX();
  const torrent = await client.addx(magnetURI);

  torrent.on('download', (bytes: number) => {
    console.debug('download', bytes);
  });
  torrent.on('upload', (bytes: number) => {
    console.debug('upload', bytes);
  });
}

main();
