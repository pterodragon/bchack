import { Button } from 'antd';
import WebTorrent from 'webtorrent';

function video() {
    return (
      <div className="video">
        <iframe width="420" height="315"
            src="https://www.youtube.com/embed/tgbNymZ7vqY">
        </iframe>
        <div class="log"></div>
      </div>
    );
  }

  /*var client = new WebTorrent()
  var torrentId = "magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent"

  client.on('error', function (err) {
    console.error('ERROR: ' + err.message)
  })

  /*document.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault() // Prevent page refresh

    var torrentId = document.querySelector('form input[name=torrentId]').value
    log('Adding ' + torrentId)
    client.add(torrentId, onTorrent)
  })

  function onTorrent (torrent) {
    log('Got torrent metadata!')
    log(
      'Torrent info hash: ' + torrent.infoHash + ' ' +
      '<a href="' + torrent.magnetURI + '" target="_blank">[Magnet URI]</a> ' +
      '<a href="' + torrent.torrentFileBlobURL + '" target="_blank" download="' + torrent.name + '.torrent">[Download .torrent]</a>'
    )

    // Print out progress every 5 seconds
    var interval = setInterval(function () {
      log('Progress: ' + (torrent.progress * 100).toFixed(1) + '%')
    }, 5000)

    torrent.on('done', function () {
      log('Progress: 100%')
      clearInterval(interval)
    })

    // Render all files into to the page
    torrent.files.forEach(function (file) {
      file.appendTo('.log')
      log('(Blob URLs only work if the file is loaded from a server. "http//localhost" works. "file://" does not.)')
      file.getBlobURL(function (err, url) {
        if (err) return log(err.message)
        log('File done.')
        log('<a href="' + url + '">Download full file: ' + file.name + '</a>')
      })
    })
  }

  function log (str) {
    var p = document.createElement('p')
    p.innerHTML = str
    document.querySelector('.log').appendChild(p)
  }*/

  export default video;