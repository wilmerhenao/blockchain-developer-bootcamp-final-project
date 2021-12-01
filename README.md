# SPANISH21

The program runs locally at http://localhost:3000 Web3.js and React

My address for the NFT is: 0x3aCB510a50D29bb5e560fAC20B104c8D5DC9a357

Please check the video on YouTube to see how everything works:
https://youtu.be/j4A9h6I7kaU

### Installing the dapp

It's easier to just watch the youtube video.

Start a local Ethereum blockchain with `ganache-cli` and connect to the local blockchain using the mnemonic.

Clone this repository and run the following commands:
```
truffle compile --all \
truffle test \
truffle migrate --reset
```

When you are done. Send money to the contract using metamask or any other method.

Run the following commands and connect the first account to the game via metamask

```
cd client \
npm run start
```

## Deployed addresses

On Ropsten:

## This is the folder tree


```
.
├── avoiding_common_attacks.md
├── deployed_addresses.md
├── design_pattern_decisions.md
├── package.json
├── package-lock.json
├── truffle-config.js
├── client
│   ├── package.json
│   ├── package-lock.json
│   ├── public
│   │   ├── myicon.ico
│   │   ├── myicon.xcf
│   │   ├── index.html
│   │   ├── manifest.json
│   ├── naipe
│   ├── src
│   │   ├── App.css
│   │   ├── App.js
│   │   ├── App.test.js
│   │   ├── getWeb3.js
│   │   ├── index.css
│   │   ├── index.js
│   │   └── logo.svg
├── contracts
│   ├── Spanish21.sol
│   ├── Migrations.sol
├── migrations
│   ├── 1_initial_migration.js
│   └── 2_deploy_contracts.js
├── test
│   ├── spanish21.test.js
│   ├── exceptionsHelpers.js
│   └── TestSpanish21.sol
└── README.md

```
