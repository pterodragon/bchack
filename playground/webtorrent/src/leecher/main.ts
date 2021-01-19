import magnet from 'magnet-uri'
import {SCClient} from '../lib/scclient'
import WebTorrent from 'webtorrent'
import util from 'util'

async function main() {
  const seeder_dht_port = 40001
  const dht_port = 40002
  // const client = new WebTorrent({dht: {bootstrap: `127.0.0.1:${seeder_dht_port}`}})
  // const client = new WebTorrent({dhtPort: dht_port, dht: {host: `127.0.0.1`}})
  const client = new SCClient(new WebTorrent({dhtPort: dht_port, dht: {host: `127.0.0.1`}}))
  const webtorrent = client.webtorrent
  webtorrent.dht.on('peer', () => {console.log('leecher: peer found')})

  // console.log('Client is downloading:', torrent.infoHash)
  // function timeoutFunc() {
  //   console.log(client.dht.toJSON())
  //   setTimeout(timeoutFunc, 1000);
  // }
  // timeoutFunc()

  const magnet_uri = 'magnet:?xt=urn:btih:861af4464ce3dd160c368a224ab2a110d7c1d485&dn=Sintel.2010.720p.mkv'
  const parsed = magnet.decode(magnet_uri)
  console.log('magnet_uri parsed', parsed)
  webtorrent.p_add = util.promisify(webtorrent.add)
  webtorrent.dht.p_lookup = util.promisify(webtorrent.dht.lookup)
  const torrent = await webtorrent.p_add(magnet_uri)
  console.log('torrent', torrent)
  console.log('leecher finished')
}

main().catch(console.log)
