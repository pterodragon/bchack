## A clean run
```bash
rm -rf .etherlime-store
npm run start
```
A local blockchain should be running at port process.env.GANACHE_PORT (default=8545, please check ".env")

at another terminal:
```bash
npm run deploy
```
you should get the following result:
```
{
  NITRO_ADJUDICATOR_ADDRESS: '0xEA9b7E11fe5467138288831Ac59EA6C9352B6cA8',
  ETH_ASSET_HOLDER_ADDRESS: '0xeF5C9fe567790be46CE06d1E5Ddc9D673DA69d17'
}
```

Then before running the nitro playground, reset your metamask wallets (connecting to localhost:8545)
https://metamask.zendesk.com/hc/en-us/articles/360015488891-Resetting-an-Account#:~:text=To%20reset%20the%20account%3A,down%20and%20click%20Reset%20Account
