import WebTorrent, {Torrent} from 'webtorrent';
import debug from 'debug';
import {SidetalkExtension} from './lib/sidetalk';
import * as utils from './lib/utils';

const log = debug('wx.seeder');

async function main() {
  const client = new WebTorrent();

  const filepath = './data/sintel.mp4';
  const opts = {announce: []}  // disable default public trackers
  const torrent = client.seed(filepath, opts);
  torrent.on('ready', () => {
    log('ready', torrent.magnetURI)
  })
  torrent.on('download', (bytes: number) => {
    log('download', bytes);
  });
  torrent.on('upload', (bytes: number) => {
    log('upload', bytes);
  });

  const wire = await utils.onWire(torrent);

  const sidetalk = SidetalkExtension.extend(wire);
  sidetalk.on('message', (msg)=> {
    log('message', msg);
  });
  sidetalk.on('handshake', (handshake)=> {
    log('handshake', handshake);
  });
  sidetalk.send({dummy: 'hihi'});

}

main();
