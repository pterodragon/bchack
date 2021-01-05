import WebTorrent from 'webtorrent'

function main() {
  let dht_port = 40001
  let client = new WebTorrent({dht: {bootstrap: `seeder:${dht_port}`}})
  console.log('client.torrents')
  console.log(client.torrents)
  console.log('---')
  console.log('leecher finished')
}

main()
