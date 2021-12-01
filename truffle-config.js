const path = require("path");

// Deploying to Ropsten using Infura
//const fs = require('fs');
//const mnemonic = fs.readFileSync(".metamaskWalletMnemonic").toString().trim();
//const HDWalletProvider = require('@truffle/hdwallet-provider');
//const infuraURL = 'https://ropsten.infura.io/v3/b9ef9bbb273848829d66f8a12cd46b2b'


module.exports = {
    contracts_build_directory: path.join(__dirname, "client/src/contracts"),

    compilers: {
        solc: {
            version: "0.7.6",
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },

    networks: {

        development: {
            host: "127.0.0.1",
            port: "8545",
            network_id: "*",
            gas: 5500000,
        },

//        rinkeby: {
//            provider: () => new HDWalletProvider(mnemonic, infuraURL),
//            network_id: 4,       // Rinkeby's network id
//            gas: 5500000,
//        },

    },
};
