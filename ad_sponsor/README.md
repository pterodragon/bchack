# Advertisement Sponsor

## Advertisement Server
This server listen advertisement request and deposit ETH into the channel provided

1. run `npm run get-movie`
2. run `npm run ad_srv`


## Client API
The API is implemented as a video.js plugin

`sample.ts` demostrate how to call it via the player created.
The player instance is also accessible via the DOM object of the video, e.g.: `document.getElementById('video-id').player`

1. Run the Advertisement Server
2. Prepare a channel on goerli (or modify the server env accordingly)
3. Run `parcel client/sample.html` 
4. Click player to play. Click `Sponsor Me` and fillin the info to trigger ad.