#!/usr/bin/env node
// Credit - https://github.com/w3f/polkadot-deployer/blob/master/lib/network/crypto.js

const fs = require("fs");
const util = require('util');

const Keyring = require('@polkadot/keyring').default;
const {mnemonicToSeed} = require('@polkadot/util-crypto');
const process = require('process');
const u8aToHex = require('@polkadot/util/u8a/toHex').default;
const {waitReady} = require('@polkadot/wasm-crypto');


module.exports = {
    sessionTypes: () => {
        return [
            'session_grandpa',
            'session_babe',
            'session_imonline'
        ];
    },
    keyTypes: () => {
        return [
            // 'stash',
            // 'controller'
        ].concat(module.exports.sessionTypes());
    },
    create: async (seeds) => {
        // if (environment) {
        //     return environmentKeys(nodes);
        // }
        const output = [];
        const keyTypes = module.exports.keyTypes();

        const keyringEd = new Keyring({type: 'ed25519'});
        const keyringSr = new Keyring({type: 'sr25519'});

        await waitReady();

        for (let counter = 0; counter < seeds.length; counter++) {
            let keys = {};
            keyTypes.forEach((type) => {
                const {seedU8a, seed, mnemonic} = seeds[counter];

                let keyring;
                if (type === 'session_grandpa') {
                    keyring = keyringEd;
                } else {
                    keyring = keyringSr;
                }

                const pair = keyring.addFromSeed(seedU8a);
                const publicKey = "0x" + Buffer.from(pair.publicKey).toString('hex');
                keys[type] = {publicKey, seed, mnemonic};
            });
            output[seeds[counter].mnemonic] = keys;
        }
        return output;
    },
};

function generateSeed(mnemonic) {
    const seedU8a = mnemonicToSeed(mnemonic);
    const seed = u8aToHex(seedU8a);

    return {seed, seedU8a, mnemonic};
}


let seedsCount = process.argv[2] ? Number(process.argv[2]) : 2000;

console.log("Generating keys for " + seedsCount + " accounts... Please wait");

let seeds = new Array(seedsCount)
    .fill(0)
    .map((_, i) => "//" + i.toString())
    .map(mnemonic => generateSeed(mnemonic));

module.exports
    .create(seeds)
    .then(keys => {
        return Object.keys(keys).map((mnemonic, index) => {
            const grandpa = keys[mnemonic].session_grandpa;
            const babe = keys[mnemonic].session_babe;
            const imonline = keys[mnemonic].session_imonline;

            let keysFileData = "" +
                util.format('"gran", "%s", "%s"\n', grandpa.seed, grandpa.publicKey) +
                util.format('"babe", "%s", "%s"\n', babe.seed, babe.publicKey) +
                util.format('"imon", "%s", "%s"', imonline.seed, imonline.publicKey);

            fs.writeFileSync(
                "../templates/nodekeys/" + index + ".txt.j2",
                keysFileData
            );
        })
    });

