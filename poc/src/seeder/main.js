import magnet from 'magnet-uri'
import magnetLink from 'magnet-link'
import createTorrent from 'create-torrent'
import fs from 'fs'
import * as R from 'ramda'


function create_magnet_link(cb.torrent_name) {
  magnetLink(torrent_name, (err, link) => {
    if (!err) {
      cb(link)
    } else {
      console.log(`error creating magnet link`)
      throw err
    }
  })
}

function create_torrent = R.curry((cb, orig_file) => {
  createTorrent(orig_file, (err, torrent) => {
    torrent_name = orig_file + '.torrent'
    if (!err) {
      fs.writeFileSync(torrent_name, torrent)
      cb(torrent_name)
    } else {
      console.log(`error creating torrent: ${torrent_name}; err = ${err}`)
      throw err
    }
  })
}
)

function main() {
  const orig_file = './src/seeder/content/Sintel.2010.720p.mkv'
  const torrent_path = create_torrent(orig_file, create_magnet_link())
  console.log(`created torrent for: ${orig_file}: path = ${torrent_path}`)

  const link = create_magnet_link(torrent_path)
  const parsed = magnet.decode(link)
  console.log(`created magnet link: ${link}; parsed =`, parsed)
}

main()
