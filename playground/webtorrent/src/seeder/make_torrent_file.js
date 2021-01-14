import createTorrent from 'create-torrent'
import fs from 'fs'

const orig_file = './src/seeder/content/Sintel.2010.720p.mkv'

createTorrent(orig_file, (err, torrent) => {
  const torrent_name = orig_file + '.torrent'

  if (!err) {
    fs.writeFileSync(torrent_name, torrent)
    console.log(`created torrent: ${torrent_name}`)
  } else {
    console.log(`error creating torrent: ${torrent_name}; err = ${err}`)
  }
})
