import 'regenerator-runtime/runtime';
import {AdSponsoredPlayer} from "./index"
import {ethers} from "ethers"
import {PromptInputSpec, promptUser} from "../../playground/rtc_nitro/web-app/ts/html-ui"

const ADVERTISEMENT_HOST = "127.0.0.1:8080";



window.onload = ()=>{
  const player = AdSponsoredPlayer("sponsored-video", ADVERTISEMENT_HOST);
  player.src(`http://${ADVERTISEMENT_HOST}/movie.mp4`);
  player.play();

  const btn = document.getElementById("request_sponsor");
  if(btn){
    btn.onclick = ()=>{
      const spec: PromptInputSpec[] = [
        {text: "ChannelID", type: "text", value:""}, 
        {text:"Amount", type:"number", value: 0}, 
        {text: "Expected Held", type: "number", value: 0},
        {text: "Unit", type: "select", value: ["wei", "gwei"]}];
      promptUser("Request Sponsor: ", spec, (response, input)=>{
        const channelId = input[0];
        const amount = ethers.utils.parseUnits(input[1], input[3]);
        const expectedHeld = ethers.utils.parseUnits(input[2], input[3]);
        console.log("Requesting: ", amount)

        player.adsponsor().request(channelId, amount, expectedHeld);
        
        player.adsponsor().on('funded', (...args: any[])=>console.log("Funded by sponsor, ", ...args))
      })
    }
  }

};