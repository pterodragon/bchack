import {PaidWTClient} from '../lib/client'
import {logger} from '../lib/logger'
import {ethers} from "ethers";
import {LocalWallet} from 'statechannel'
import {ETHERLIME_ACCOUNTS} from "@statechannels/devtools";
import dotenv from "dotenv"
dotenv.config()

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    `http://${process.env.GANACHE_HOST}:${process.env.GANACHE_PORT}`
  );
  await provider.ready

  const wallet = new LocalWallet(provider, ETHERLIME_ACCOUNTS[1].privateKey);

  const client = new PaidWTClient(wallet, {'ut_sidetalk_opts': {'is_leecher': true}})
  await client.run_leecher()
  logger.info('main done')
}

main()
