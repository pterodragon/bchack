import WebTorrent, {Torrent, Options as WebTorrentOptions} from 'webtorrent'; import debug from 'debug';
import {Wire} from 'bittorrent-protocol';
import {WireSidetalk} from '../lib/sidetalk';
import {WireControl} from '../lib/control';

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

  torrent.on('wire', async(wire: Wire) => {
    log('wire', wire.peerId);
    wire.setKeepAlive(true);

    const sidetalk = await WireSidetalk.extend(wire);
    sidetalk.on('handshake', (handshake)=> {
      log('handshake', handshake);
    })

    const control = WireControl.extend(wire);
    sidetalk.on('message', (msg:any)=> {
      log('message', msg, torrent.done);
      if (msg.next) {
        control.next();
      }
    });
  });


}


main();
