import {PaidWTClient} from '../lib/client'
import {logger} from '../lib/logger'
import {ethers} from "ethers";
import {LocalWallet} from 'statechannel'
import {ETHERLIME_ACCOUNTS} from "@statechannels/devtools";

import dotenv from "dotenv";

dotenv.config()

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    `http://${process.env.GANACHE_HOST}:${process.env.GANACHE_PORT}`
  );
  logger.debug('provider %o', provider)

  const wallet = new LocalWallet(provider, ETHERLIME_ACCOUNTS[0].privateKey);

  const client = new PaidWTClient(wallet, {'ut_sidetalk_opts': {'is_seeder': true}})
  await client.run_seeder()
  logger.info('main done')
}

main()
