import WebTorrent from 'webtorrent-hybrid';
import debug from 'debug';

const log = debug('wxp.dummy');
main();


function main() {
  /* Set up an ethereum provider connected to our local blockchain */
 const server = new WebTorrent();

  const opts = {announce: []}  // disable default public trackers
  const torrent = server.seed('./data/sample.mp4', opts);
  torrent.on('ready', () => log('ready', torrent.magnetURI));
  torrent.on('download', (bytes: number) => log('download', bytes));
  torrent.on('upload', (bytes: number) => log('upload', bytes));
  torrent.on('wire', (wire) => {
    log('wire', wire.peerId);
  });
}

