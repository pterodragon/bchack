import util from 'util'
import WebTorrent from 'webtorrent'


async function main() {
  const filepath = './src/seeder/content/Sintel.2010.720p.mkv'
  const dht_port = 40001
  // const client = new WebTorrent({dhtPort: dht_port})
  const client = new WebTorrent({dhtPort: dht_port, dht: {bootstrap: false}})
  client.p_seed = util.promisify(client.seed)
  const seed_opts = {announceList: []}  // disable default public trackers
  try {
    await client.p_seed(filepath, seed_opts)
  } catch (err) {
    console.log(err)
  }
  // console.log(client.dht.toJSON())
  console.log('Client is seeding')
}

main().catch(console.log)
