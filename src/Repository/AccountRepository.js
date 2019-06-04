'use strict';

const { WavesAccount, SavedWavesAccount } = require(__dirname + '/../Account.js');

// Database table name
const TABLE = 'smart_accounts';

exports.AccountRepository = class AccountRepository {
    // Accepts mysql connection created with the mysql object from `mysql` package
    constructor(connection, chainId) {
        this._connection = connection;
        console.log('AccountRepository::constructor chainId', chainId)
        this._chainId = chainId;
    }

    get connection() {
        return this._connection;
    }

    // Inserts a WavesAccount into database
    // Returns Promise resolved with the account.
    insert(account) {
        let self = this;

        return new Promise((resolve, reject) => {
            if (!account instanceof WavesAccount) {
                return reject(Error('The argument must be an instance of WavesAccount'));
            }

            const sql = `INSERT INTO ${TABLE} SET
                public_key = ?, private_key = ?, seed = ?, added = NULL`;
            const params = [
                account.publicKey,
                account.privateKey,
                account.seed,
            ];
            self._connection.query(sql, params, (error, results, fields) => {
                if (error) {
                    return reject(error);
                }
                resolve(account);
            });
        });
    }

    // Returns Promise that resolves to SavedWavesAccount on success.
    // Otherwise, the promise is rejected with an Error.
    get(publicKey) {
        let self = this;

        return new Promise((resolve, reject) => {
            const sql = `SELECT public_key, private_key, seed FROM ${TABLE} WHERE public_key = ? LIMIT 1`;
            self._connection.query(sql, publicKey, (error, results, fields) => {
                if (error) {
                    return reject(error);
                }
                resolve(new SavedWavesAccount(results[0], self._chainId));
            });
        });
    }

    get chainId() {
        return this._chainId;
    }
};
