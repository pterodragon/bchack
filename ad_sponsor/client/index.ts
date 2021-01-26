import { ethers } from "ethers";
import videojs, { VideoJsPlayer, VideoJsPlayerOptions, VideoJsPlayerPluginOptions } from "video.js";
const  videojs_ads = require("videojs-contrib-ads");
import event from "events"
import {io} from "socket.io-client"

export interface AdSponsor{
  on(type: 'funded', listener?:(destination: string, amountGained: ethers.BigNumber)=>void): void;

  request(destination: string, desiredAmount: ethers.BigNumber): void;
}

const PLUGIN_NAME = 'adsponsor';

interface BigNumberALike{
  hex: string;
  type: 'BigNumber';
}

interface ExtendedVideoJsPlayer extends VideoJsPlayer{
  readonly [pluginName: string]: ((...args: Array<any>)=>any) | any;
}

const Plugin = videojs.getPlugin('plugin');
class AdSponsorPlugin extends Plugin implements AdSponsor{
  private signalingURL: string;
  private assetURL: string;
  public player: ExtendedVideoJsPlayer;

  constructor(player: videojs.Player, options: any){
    super(player, options);

    this.player = player as ExtendedVideoJsPlayer;
    this.player.ads();

    this.signalingURL = options.signalingURL;
    this.assetURL = options.assetURL;
  }
  
  request(destination: string, desiredAmount: ethers.BigNumber, expectedHeld: ethers.BigNumber = ethers.constants.Zero): void {
    const signaling = io(this.signalingURL);
    const player = this.player;
    const assetHost = this.assetURL;


    const control = player.getChild('ControlBar');
    const progressBar = control?.getChild('ProgressControl')

    signaling.on('connect', ()=>{
      signaling.emit('request-ad', destination, desiredAmount, expectedHeld);
    })
    .on('ad-ready', (ad: {path: string, id: string})=>{
      player.one('adended', ()=>{
        player.ads.endLinearAdMode();
        if(progressBar){
          (progressBar as any).enable()
        }
      })
      if(!player.ads.isInAdMode()){
        player.ads.startLinearAdMode();
        if(progressBar){
          (progressBar as any).disable()
        }
        player.src(`${assetHost}/${ad.path}`);
        signaling.emit('ad-completed', ad.id);
      }
    })
    .on('completed', (event: {id: string, destination: string, amount: BigNumberALike, details: unknown})=>{
      console.log("Completed. Details: ", event.details)
      const amountGained = ethers.BigNumber.from(event.amount);
      player.trigger({type: 'funded'}, {destination, amountGained});
      signaling.close();
    })
    .on('ad-error', (error:{msg:string})=>{

    })
  }
}

videojs.registerPlugin(PLUGIN_NAME, AdSponsorPlugin);

export function AdSponsoredPlayer(htmlElemId: string, sponsorHost: string = "127.0.0.1:8080", options?: VideoJsPlayerOptions): ExtendedVideoJsPlayer{
  const websocketHost = `ws://${sponsorHost}/`;
  const assetHost = `http://${sponsorHost}/`;
  
  options = options || {} as VideoJsPlayerOptions;
  options.plugins = options.plugins || {} as VideoJsPlayerPluginOptions
  options.plugins[PLUGIN_NAME] = {
    signalingURL: websocketHost,
    assetURL: assetHost
  }

  const player = videojs(htmlElemId, options) as ExtendedVideoJsPlayer;
  player.adsponsor();

  return player;
}