export default function(state={}, action) {
  switch (action.type) {
    case 'TORRENT':
      const {  timeRemaining, downloaded, uploaded, downloadSpeed, uploadSpeed, length, numPeers, name } = action.torrent;

      return { 
        name, 
        length: Math.round(length/1024)+'KB',
        downloaded: Math.round(downloaded/1024)+'KB',
        uploaded: Math.round(uploaded/1024)+'KB', 
        downloadSpeed: Math.round(downloadSpeed/1024)+'KB/s',
        uploadSpeed: Math.round(uploadSpeed/1024)+'KB/s', 
        ratio: downloaded/length
      };
  }
  return state;
}

