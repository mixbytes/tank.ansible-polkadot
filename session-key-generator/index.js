#!/usr/bin/env node
// Credit - https://github.com/w3f/polkadot-deployer/blob/master/lib/network/crypto.js

const {DEV_PHRASE} = require("@polkadot/keyring/defaults");

const fs = require("fs");
const util = require('util');

const {isHex, hexToU8a, stringToU8a, assert} = require("@polkadot/util");
const KeyPair = require('@polkadot/keyring/pair').default;
const {
    keyExtractSuri,
    mnemonicToMiniSecret,
    schnorrkelKeypairFromSeed,
    naclKeypairFromSeed,
    keyFromPath
} = require('@polkadot/util-crypto');
const process = require('process');
const {waitReady} = require('@polkadot/wasm-crypto');


module.exports = {
    sessionTypes: () => {
        return [
            'session_grandpa',
            'session_babe',
            'session_imonline',
            'session_parachain'
        ];
    },
    keyTypes: () => {
        return [
            // 'stash',
            // 'controller'
        ].concat(module.exports.sessionTypes());
    },
    seedAndPathFromUri: (_suri) => {
        const suri = _suri.startsWith('//') ? "".concat(DEV_PHRASE).concat(_suri) : _suri;
        const {
            password,
            phrase,
            path
        } = keyExtractSuri(suri);
        let seed;

        if (isHex(phrase, 256)) {
            seed = hexToU8a(phrase);
        } else {
            const str = phrase;
            const parts = str.split(' ');

            if ([12, 15, 18, 21, 24].includes(parts.length)) {
                // FIXME This keeps compat with older versions, but breaks compat with subkey
                // seed = type === 'sr25519'
                //   ? mnemonicToMiniSecret(phrase, password)
                //   : mnemonicToSeed(phrase, password);
                seed = mnemonicToMiniSecret(phrase, password);
            } else {
                assert(str.length <= 32, 'specified phrase is not a valid mnemonic and is invalid as a raw seed at > 32 bytes');
                seed = stringToU8a(str.padEnd(32));
            }
        }
        return {seed, path};
    },
    keypairFromSeedAndPath: (seed, path, type) => {
        const keypair = type === 'sr25519' ? schnorrkelKeypairFromSeed(seed) : naclKeypairFromSeed(seed);
        const derived = keyFromPath(keypair, path, type);
        return KeyPair(type, derived, {}, null);
    },
    create: async (mnemonics) => {
        const output = [];
        const keyTypes = module.exports.keyTypes();

        await waitReady();

        mnemonics.forEach(mnemonic => {
            const seedAndPath = module.exports.seedAndPathFromUri(mnemonic);
            const ed = module.exports.keypairFromSeedAndPath(
                seedAndPath.seed,
                seedAndPath.path,
                'ed25519'
            );
            const sr = module.exports.keypairFromSeedAndPath(
                seedAndPath.seed,
                seedAndPath.path,
                'sr25519'
            );
            let keys = {};
            keyTypes.forEach((type) => {
                let keyPair = type === 'session_grandpa' ? ed : sr;
                const publicKey = "0x" + new Buffer.from(keyPair.publicKey).toString('hex');
                keys[type] = {publicKey, seed: mnemonic};
            });
            output[mnemonic] = keys;
        });

        return output;
    },
};


let seedsCount = process.argv[2] ? Number(process.argv[2]) : 2000;

console.log("Generating keys for " + seedsCount + " accounts... Please wait");

let seeds = new Array(seedsCount)
    .fill(0)
    .map((v, index) => index)
    .map((_, i) => "//v" + i.toString());
// let seeds = ["//v0"];

module.exports
    .create(seeds)
    .then(keys => {
        console.log("Keys generated, writing to files...");
        return Object.keys(keys).map((mnemonic, index) => {
            const grandpa = keys[mnemonic].session_grandpa;
            const babe = keys[mnemonic].session_babe;
            const imonline = keys[mnemonic].session_imonline;
            const parachain = keys[mnemonic].session_parachain;

            let keysFileData = "" +
                util.format('"gran", "%s", "%s"\n', grandpa.seed, grandpa.publicKey) +
                util.format('"babe", "%s", "%s"\n', babe.seed, babe.publicKey) +
                util.format('"imon", "%s", "%s"\n', imonline.seed, imonline.publicKey) +
                util.format('"para", "%s", "%s"', parachain.seed, parachain.publicKey);

            // console.log(keysFileData);

            fs.writeFileSync(
                "../templates/nodekeys/" + index + ".txt.j2",
                keysFileData
            );
        })
    });

