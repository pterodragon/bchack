import {
  Channel, State, getChannelId
} from "@statechannels/nitro-protocol";

import { Wallet } from "./wallet/wallet";

export declare type CreateRequest = {
  chainId: string,
  participants: string[]
}

export declare type CreateResponse = {
  receiver: string,
  channelId: string,
  channel: Channel,
  state: State,
}

export function requestCreate(chainId: string, wallet: Wallet): CreateRequest {
  return {
    chainId, participants: [wallet.getAddress()]
  }
}

export function responseCreate(request: CreateRequest, wallet :Wallet): CreateResponse {
  const receiver = wallet.getAddress();
  const channel = getChannel(request.chainId, [...request.participants, receiver]);
  const channelId = getChannelId(channel);
  const state = createState();
  return { receiver, channelId, channel, state };
}



function getChannel(chainId: string, participants: string[]): Channel {
  return {
    participants,
    chainId,
    channelNonce: Math.floor(Math.random() * 100000) 
  };
}

