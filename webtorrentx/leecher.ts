import WebTorrent, {Options as WebTorrentOptions, Torrent} from 'webtorrent';
import {Wire} from 'bittorrent-protocol';
import debug from 'debug';
import {SidetalkExtension} from './lib/sidetalk';

const log = debug('wx.leecher');

async function main() {
  const client = new WebTorrent();

  const magnetURI = 'magnet:?xt=urn:btih:40bd75fda6718259107cf315c845c85cf8bab9ef&dn=sample.mp4';
  const torrent = client.add(magnetURI);
  torrent.on('download', (bytes: number) => {
    log('download', bytes);
  });
  torrent.on('upload', (bytes: number) => {
    log('upload', bytes);
  });

  torrent.on('wire', async(wire: Wire) => {
    log('wire', wire.peerId);
    wire.setKeepAlive(true);

    const sidetalk = await SidetalkExtension.extend(wire);
    sidetalk.on('handshake', (handshake)=> {
      log('handshake', handshake);
    })

    sidetalk.on('message', (msg)=> {
      log('message', msg);
    });

    const it = setInterval(
      ()=>sidetalk.send({next: 1}),
      2000
    );

    torrent.once('cancel', ()=>
      clearInterval(it)
    );
  });


}

main();
