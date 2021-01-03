import magnet from 'magnet-uri'
import magnetLink from 'magnet-link'
import createTorrent from 'create-torrent'
import util from 'util'

const create_torrent = util.promisify(createTorrent)
const create_magnet_link = util.promisify(magnetLink)

async function main() {
  const orig_file = './src/seeder/content/Sintel.2010.720p.mkv'
  const torrent_path = orig_file + '.torrent'
  await create_torrent(orig_file)
  const link = await create_magnet_link(torrent_path)
  const parsed = magnet.decode(link)
  console.log(`created magnet link: ${link}; parsed =`, parsed)
  console.log('finished running seeder');
}

(async () => {
  try {
    await main();
  } catch (e) {
    console.log('error running seeder', e.message, e.stack);
  }
})();
