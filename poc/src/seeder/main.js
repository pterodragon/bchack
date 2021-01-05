import util from 'util'
import WebTorrent from 'webtorrent'


async function main() {
  let filepath = './src/seeder/content/Sintel.2010.720p.mkv'
  let client = new WebTorrent({dhtPort: 40001})
  let client_seed = util.promisify(client.seed)
  let torrent = await client_seed(filepath)
  console.log('Client is seeding')
  console.log(torrent)
}

main().catch(console.log)
