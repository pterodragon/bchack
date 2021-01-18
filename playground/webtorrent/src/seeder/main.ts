import util from 'util';
import {SCClient} from '../lib/mre'
// import {ut_sidetalk} from '../extension/ut_sidetalk'


async function main() {
  const filepath = './src/seeder/content/Sintel.2010.720p.mkv';
  const dht_port = 40001;
  // const client = new WebTorrent({dhtPort: dht_port})
  // const client = new SCClient({dhtPort: dht_port, dht: {bootstrap: false}});
  const client = new SCClient();
  const p_seed = util.promisify(client.seed);
  const seed_opts = {announceList: []}  // disable default public trackers
  try {
    // @ts-ignore: fuck typescript here
    const torrent = await p_seed.call(client, filepath, seed_opts);
  } catch (err) {
    console.log(err);
  }
  // console.log(client.dht.toJSON())
  console.log('Client is seeding');
}

main().catch(console.log);
