'use strict';

const { WavesAccount, SavedWavesAccount } = require(__dirname + '/../Account.js');
const { base58decode, base58encode } = require('@waves/waves-crypto');

// Database table name
const TABLE = 'smart_accounts';

function uint8ArrayToBinaryString(u8Array) {
    const len = u8Array.length;
    let bin = '';

    for (let i = 0; i < len; i++) {
        bin += String.fromCharCode(u8Array[i]);
    }

    return bin;
}

exports.AccountRepository = class AccountRepository {
    // Accepts mysql connection created with the mysql object from `mysql` package
    constructor(connection, chainId) {
        this._connection = connection;
        this._chainId = chainId;
    }

    get connection() {
        return this._connection;
    }

    // Inserts a WavesAccount into database
    // Returns Promise resolved with the account.
    insert(account) {
        return new Promise((resolve, reject) => {
            if (!account instanceof WavesAccount) {
                return reject(Error('The argument must be an instance of WavesAccount'));
            }

            const sql = `INSERT INTO ${TABLE} SET
                public_key = ?, private_key = ?, seed = ?, added = NULL`;
            const params = [
                uint8ArrayToBinaryString(base58decode(account.publicKey)),
                uint8ArrayToBinaryString(base58decode(account.privateKey)),
                account.seed,
            ];
            console.log('sql', sql, 'params', JSON.stringify(params));
            this._connection.query(sql, params, (error, results, fields) => {
                console.log('insert query callback()')
                if (error) {
                    return reject(error);
                }
                console.log('insert query callback() resolve(account)')
                resolve(account);
            });
        });
    }

    // Returns Promise that resolves to SavedWavesAccount on success.
    // Otherwise, the promise is rejected with an Error.
    get(publicKey) {
        console.log('get(), publicKey', publicKey);
        return new Promise((resolve, reject) => {
            const sql = `SELECT public_key, private_key, seed FROM ${TABLE} WHERE public_key = ?`;
            const publicKeyBin = uint8ArrayToBinaryString(base58decode(publicKey));
            console.log('publicKeyBin', publicKeyBin);
            this._connection.query(sql, publicKeyBin, (error, results, fields) => {
                if (error) {
                    return reject(error);
                }
                console.log('results', results);
                results.public_key = base58encode(results.public_key);
                results.private_key = base58encode(results.private_key);
                resolve(new SavedWavesAccount(results, this._chainId));
            });
        });
    }

    get chainId() {
        return this._chainId;
    }
};
