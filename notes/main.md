# Related topics
## Web3torrent
- site: https://blog.statechannels.org/introducing-web3torrent/
- exactly what we're doing?

## Bittorrent BTT
- token as incentive to seeds
- BitTorrent Speed (TM)
  - will be integrated into future participating BitTorrent and uTorrent clients
  - allows token exchange (BTT)
  - overlay on top of the existing bittorrent protocol
  - let users to advertise their bids within a swarm and to trade BTT in exchange for continued prioritized access to seeds
    - [1st release of BTT] bid = (tunable rate) * balance / (remaining bytes to download)
    - sealed-bid
    - determination of unchoked slots (c.f. choke) slots (winning bid) relies on BTT bid + data received (data that the seeds sent)
    - timeout and get banned if either side doesn't send data/BTT (smart-contract-like refund)
    - breach exposure
      - provider: 1 piece worth of bandwidth (in case requester doesn't pay)
      - requester: None
    - clients can change bid <= 1 times per min
- BTT service
  - can implement our own
  - BTT service offered by Bittorrent the company
    - decentralized CDN for providers to advertise the bids and the data pieces
    - decentralized storage (requester can ask providers to store data there for a fee to the Bittorrent company)
    - decentralized proxy service for requesters to ask providers to download content by URL
- Implementation Considerations
  - Blockchain
    - to reduce fraud, all services should provide in increments
    - ideally each transaction is done in 1 sec, so most existing public blockchain can't faciliate this
  - User controls
    - any BTT transaction has to be disclosed
    - no forced participation in BTT transaction
  - Initial Disbursement
    - Bittorrent company will pre-seed the market with promotional quantities of BTT
  - Identity
    - similar to major cryptocurrencies: whoever has a means to access a token has that token
  - BTT Token Issuance (initial)
    - Bittorrent company, Tron foundation, public/private sales all got allocated some tokens
- FAQ
  - Why not rewrite the BitTorrent protocol?
- tags: cryptocurrency, bittorrent

## Avxchange
https://medium.com/hackernoon/avxchange-a-distributed-peer-to-peer-p2p-file-sharing-platform-powered-by-blockchain-29a30d400e2a

- network nodes & content creators share revenue
- tags: piracy, startup

## Filecoin
- https://filecoin.io/
  - blockchain-based cooperative digital storage and data retrieval method. (wikipedia)
  - built on top of IPFS
- tags: cryptocurrency

## Swarm
- https://swarm.ethereum.org/
- has a free book for the design, architecture, and incentive etc.
- tags: project related, ethereum, P2P, smart contract, company

## IPFS (InterPlanetary File System)
- something similiar to Bittorrent
- single global swarm?
- tags: P2P

# Useful links

- Swarm vs IPFS
  - https://ethereum.stackexchange.com/questions/2138/what-is-the-difference-between-swarm-and-ipfs
- IPFS vs Bittorrent
  - https://news.ycombinator.com/item?id=18650670
  - IPFS is a single global swarm?
- Glossary of Bittorrent terms
  - https://en.wikipedia.org/wiki/Glossary_of_BitTorrent_terms


# Terms
- Kademlia - distributed hash table for P2P network
