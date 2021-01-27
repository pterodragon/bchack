import {Instance as WebTorrent, Torrent, TorrentOptions} from 'webtorrent';
import debug from 'debug';
import {Wire} from 'bittorrent-protocol';

const log = debug('wx.utils');

export async function onWire(torrent:Torrent): Promise<Wire> {
  return new Promise(resolv=>torrent.on('wire', (wire:Wire)=> {
    log('on wire');
    resolv(wire);
  }));
}

