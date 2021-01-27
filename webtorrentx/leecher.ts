import WebTorrent, {Torrent} from 'webtorrent';
import debug from 'debug';
import {SidetalkExtension} from './lib/sidetalk';
import * as utils from './lib/utils';

const log = debug('wx.leecher');

async function main() {
  const client = new WebTorrent();

  const magnetURI = 'magnet:?xt=urn:btih:3ed0ed882486762b9e595b9d0ced28d6c1f1faa3&dn=sintel.mp4';
  const torrent = client.add(magnetURI);
  torrent.on('download', (bytes: number) => {
    log('download', bytes);
  });
  torrent.on('upload', (bytes: number) => {
    log('upload', bytes);
  });

  const wire = await utils.onWire(torrent);
  const sidetalk = await SidetalkExtension.extend(wire);
  sidetalk.on('handshake', (handshake)=> {
    log('handshake', handshake);
  })
  sidetalk.on('message', (msg)=> {
    log('message', msg);
  });
  sidetalk.send({msg1: 'byebye'});


}

main();
