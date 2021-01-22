import util from 'util';
import {SCClient} from '../lib/scclient'
import WebTorrent from 'webtorrent';
import dotenv from "dotenv";
import {logger} from '../lib/logger'

dotenv.config()


async function main() {
  const filepath = process.env.SEED_FILEPATH;

  // using LSD
  const client = new SCClient(new WebTorrent(), {'ut_sidetalk_opts': {'is_seeder': true}});
  // const client = new SCClient(new WebTorrent({dht: {bootstrap: []}}));

  const seed_opts = {announceList: []}  // disable default public trackers
  // const seed_opts = {}

  const torrent = await new Promise( (resolve, reject) => {
    try {
      client.seed(filepath, seed_opts, (torrent) => resolve)
    } catch (err) {
      reject(err)
    }
  })
  // const uri = torrent.torrent.magnetURI
  // console.log(client.dht.toJSON())
  // logger.info('Client is seeding: %s', uri);
  logger.info('Client is seeding %o', torrent);
}

main();
