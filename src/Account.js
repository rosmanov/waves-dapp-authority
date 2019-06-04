'use strict';

const { seedUtils} = require('@waves/waves-transactions');
const { keyPair, address } = require('@waves/waves-crypto');

const TESTNET_CHAIN_ID = 'T';
const MAINNET_CHAIN_ID = 'W';

const checkChainId = (chainId) => {
    if (typeof chainId !== 'string') {
        throw new Error('Chain ID must be a string');
    }
    if (chainId !== TESTNET_CHAIN_ID && chainId !== MAINNET_CHAIN_ID) {
        throw new Error('Invalid chain ID passed');
    }
};

// An account saved into the database.
exports.SavedWavesAccount = class SavedWavesAccount {
    constructor(fields, chainId) {
        this._publicKey = fields.public_key;
        this._privateKey = fields.private_key || null;
        this._seed = fields.seed || null;

        checkChainId(chainId);
        this._chainId = chainId;
    }

    get publicKey() {
        return this._publicKey;
    }

    get address() {
        return address(this._publicKey, this._chainId);
    }

    get seed() {
        return this._seed;
    }

    get privateKey() {
        return this._privateKey;
    }
};

exports.WavesAccount = class WavesAccount {
    constructor(seed, chainId) {
        if (seed === null) {
            seed = seedUtils.generateNewSeed();
        }
        if (typeof seed !== 'string') {
            throw new Error('Seed must be a string');
        }
        checkChainId(chainId);
        this._chainId = chainId;
        this._seed = seed;
        this._publicKey = null;
        this._privateKey = null;
        this._address = null;
        this._loadFields();

    }

    static get TESTNET_CHAIN_ID() {
        return TESTNET_CHAIN_ID;
    }

    static get MAINNET_CHAIN_ID() {
        return MAINNET_CHAIN_ID;
    }

    static generateNewSeed() {
        return seedUtils.generateNewSeed();
    }

    _loadFields() {
        const keys = keyPair(this._seed);
        if (!keys) {
            throw new Error(`Failed generating key pair from seed ${this._seed}`);
        }
        this._publicKey = keys.public;
        this._privateKey = keys.private;
        this._address = address(keys.public, this._chainId);
    }

    get seed() {
        return this._seed;
    }

    get publicKey() {
        return this._publicKey;
    }

    get privateKey() {
        return this._privateKey;
    }

    get address() {
        return this._address;
    }

    get chainId() {
        return this._chainId;
    }
}
