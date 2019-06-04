'use strict';

const jsonrpc = require('jsonrpc-lite');
const { compile } = require('@waves/ride-js');
const { transfer, broadcast, setScript } = require('@waves/waves-transactions');
const { WavesAccount } = require( __dirname + '/../Account.js');
const { AccountRepository } = require(__dirname + '/../Repository/AccountRepository.js');

const INVALID_PARAMS_ERROR_CODE = -32602;
const INTERNAL_SERVER_ERROR_CODE = -32603;

// Returns JSON-RPC error object.
const newJsonRpcError = (errorText, response, code) => {
    if (code === undefined) {
        code = INTERNAL_SERVER_ERROR_CODE;
    }
    return jsonrpc.error(
        code,
        new jsonrpc.JsonRpcError(errorText, code)
    );
};

class SetAppScriptController {
    constructor(dbConnection, nodeApiConfig) {
        this._nodeApiConfig = nodeApiConfig;
        this._accountRepo = new AccountRepository(dbConnection, nodeApiConfig.chainId);
    }

    handle(req, res, next) {
        let self = this;
        let publicKey = null;
        let rideCompiled = null;

        const errorHandler = (error) => {
            console.error('Error', error)
            res.status(500).json(newJsonRpcError(error, res));
            next();
        };

        Promise.resolve()
            .then(() => {
                return self.parseParams(req.body.params);
            }, errorHandler)
            .then((params) => {
                publicKey = params[0];
                rideCompiled = params[1];
                return self._accountRepo.get(publicKey);
            }, errorHandler)
            .then((targetAccount) => {
                return self.setAccountScript(targetAccount, rideCompiled);
            }, errorHandler)
            .then((tx) => {
                console.log(`Transaction ${tx.id} has been scheduled`);
                let result = {
                    ride: rideCompiled.result.base64,
                    txId: tx.id,
                    public_key: publicKey,
                };
                res.json(jsonrpc.success(req.body.id || 0, result));
            }, errorHandler)
            .catch(next);
    }

    parseParams(params) {
        return new Promise((resolve, reject) => {
            let publicKey = params.public_key;
            if (typeof publicKey !== 'string') {
                return reject('Invalid public_key parameter');
            }

            let buf = new Buffer(params.ride, 'base64')
            const rideCompiled = compile(buf.toString('ascii'));
            if (typeof rideCompiled.error === 'string') {
                return reject('Failed to compile RIDE code: ' + rideCompiled.error);
            }

            resolve([publicKey, rideCompiled])
        });
    }

    setAccountScript(targetAccount, rideCompiled) {
        let self = this;

        const params = {
            script: rideCompiled.result.base64,
            senderPublicKey: targetAccount.publicKey,
            chainId: targetAccount.chainId,
            fee: self._nodeApiConfig.setScriptDefaultFee,
        };
        console.log('setAccountScript params', params);
        const scriptTx = setScript(params, targetAccount.seed);
        return broadcast(scriptTx, self._nodeApiConfig.baseUri);
    }
}

class NewAppController {
    constructor(systemAccount, nodeApiConfig, dbConnection) {
        this._systemAccount = systemAccount;
        this._nodeApiConfig = nodeApiConfig;
        //this._waitForTxParams = {
            //apiBase: nodeApiConfig.baseUri,
            //timeout: nodeApiConfig.transactionWaitTimeout,
        //};
        this._accountRepo = new AccountRepository(dbConnection, nodeApiConfig.chainId);
    }

    parseParams(params) {
        return new Promise((resolve, reject) => {
            const amount = Number(params.amount);
            if (isNaN(amount)) {
                return reject(`'amount' parameter must be a number`);
            }

            resolve([amount]);
        });
    }

    handle(req, res, next) {
        let self = this;
        let amount = 0;

        Promise.resolve().then(() => {
            const targetAccount = new WavesAccount(null, self._nodeApiConfig.chainId);

            const transferErrorHandler = (error) => {
                res.status(500).json(newJsonRpcError(
                    `Failed to transfer ${amount} to ${targetAccount.address}:` + error,
                    res
                ));
            };

            self.parseParams(req.body.params)
                .then((params) => {
                    amount = params[0];
                }, (error) => {
                    console.error('Error', error)
                    res.status(400).json(newJsonRpcError(
                        error,
                        res,
                        INVALID_PARAMS_ERROR_CODE
                    ));
                })
                .then(() => {
                    return self.saveAccount(targetAccount);
                })
                .then(() => {
                    return self.transfer(targetAccount, amount)
                })
                .then((tx) => {
                    console.log(`Transaction ${tx.id} has been scheduled`);
                    let result = {
                        txId: tx.id,
                        public_key: targetAccount.publicKey,
                    };
                    res.json(jsonrpc.success(req.body.id || 0, result));
                });
        }).catch(next);
    }

    saveAccount(targetAccount) {
        let self = this;

        console.log('Saving account into database, public key', targetAccount.publicKey);
        return this._accountRepo.insert(targetAccount);
    }

    // Transfers `amount` WAVES from the system account to `targetAccount`
    // Waits for the transfer transaction to be mined.
    transfer(targetAccount, amount) {
        let self = this;

        // Transfer `amount` from system account to the target account
        console.log(`Transferring ${amount} WAVES from ${self._systemAccount.publicKey} `,
            `to ${targetAccount.address} fee ${self._nodeApiConfig.setScriptDefaultFee}`);

        const params = {
            amount: amount,
            recipient: targetAccount.address,
            senderPublicKey: self._systemAccount.publicKey,
            chainId: targetAccount.chainId,
            fee: self._nodeApiConfig.setScriptDefaultFee,
        };
        const transferTx = transfer(params, self._systemAccount.seed);
        return broadcast(transferTx, self._nodeApiConfig.baseUri);
    }
};

module.exports = (systemAccount, nodeApiConfig, dbConnection) => {
    let controller;

    return (req, res, next) => {
        switch (req.body.method) {
            case 'new-app':
                controller = new NewAppController(
                    systemAccount,
                    nodeApiConfig,
                    dbConnection
                );
                break;
            case 'set-script':
                controller = new SetAppScriptController(
                    dbConnection,
                    nodeApiConfig
                );
                break;

        }
        controller.handle(req, res, next);
    };
};
