import util from 'util';
import {SCClient} from '../lib/scclient'
import WebTorrent from 'webtorrent';
// import {ut_sidetalk} from '../extension/ut_sidetalk'


async function main() {
  const filepath = './src/seeder/content/Sintel.2010.720p.mkv';
  const dht_port = 40001;
  const client = new SCClient(new WebTorrent({dhtPort: dht_port, dht: {bootstrap: false}}));
  const seed_opts = {announceList: []}  // disable default public trackers

  try {
    const torrent = await new Promise( (resolve, reject) => {
      client.seed(filepath, seed_opts, (torrent) => resolve)
    })
  } catch (err) {
    console.log('seeder main error', err);
  }
  // console.log(client.dht.toJSON())
  console.log('Client is seeding');
}

try {
  main();
} catch (err) {
  console.log('seeder main error2', err)
}
