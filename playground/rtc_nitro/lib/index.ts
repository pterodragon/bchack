import { ethers } from "ethers";

export interface AdSponsor{
  on(event: 'sponsor-completed', listener:(destination: string, amountGained: ethers.BigNumber)=>void): this;

  requestSponsor(destination: string, desiredAmount: ethers.BigNumber): void;
}