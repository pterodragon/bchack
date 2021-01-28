import WebTorrent, {Torrent, Options as WebTorrentOptions} from 'webtorrent';
import debug from 'debug';
import {Wire} from 'bittorrent-protocol';
import {SidetalkExtension} from './lib/sidetalk';
import {WireControl} from './lib/control';

const log = debug('wx.seeder');

async function main() {
  const client = new WebTorrent();

  const filepath = './data/sample.mp4';
  const opts = {announce: []}  // disable default public trackers
  const torrent = client.seed(filepath, opts);
  torrent.on('ready', () => {
    log('ready', torrent.magnetURI)
  });

  torrent.on('download', (bytes: number) => {
    log('download', bytes);
  });
  torrent.on('upload', (bytes: number) => {
    log('upload', bytes);
  });

  torrent.once('wire', async(wire: Wire) => {
    wire.setKeepAlive(true);

    const sidetalk = await SidetalkExtension.extend(wire);
    sidetalk.on('handshake', (handshake)=> {
      log('handshake', handshake);
    })

    const control = new WireControl(wire);
    sidetalk.on('message', (msg:any)=> {
      log('message', msg, torrent.done);
      if (msg.next) {
        control.next();
      }
    });
  });


}


main();
