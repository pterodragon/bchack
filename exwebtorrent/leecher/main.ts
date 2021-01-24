import magnet from 'magnet-uri'
import {SCClient} from '../lib/scclient'
import WebTorrent from 'webtorrent'
import util from 'util'
import dotenv from "dotenv";
import {logger} from '../lib/logger'

dotenv.config()

async function main() {
  // using LSD
  const client = new SCClient(new WebTorrent(), {'ut_sidetalk_opts': {'is_leecher': true}})
  // const client = new SCClient(new WebTorrent({dht: {bootstrap: []}}))

  // const webtorrent = client.webtorrent
  // webtorrent.dht.on('peer', () => {console.log('leecher: peer found')})

  const magnet_uri = 'magnet:?xt=urn:btih:861af4464ce3dd160c368a224ab2a110d7c1d485&dn=Sintel.2010.720p.mkv'
  // const parsed = magnet.decode(magnet_uri)
  // logger.debug('magnet_uri parsed', parsed)
  setInterval(() => {
    client.webtorrent.torrents.forEach(
      (torrent) => {
        torrent.wires.forEach(
          (wire) => {
            wire.ut_sidetalk.send('topup', {})
          }
        )
      }
    )}, 15000)

  const torrent = await new Promise((resolve, reject) => {
    try {
      return client.add(magnet_uri, (torrent) => resolve)
    } catch (err) {
      reject(err)
    }
  })

  logger.info('leecher finished')
}

main()
