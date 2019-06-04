#!/usr/bin/env nodejs
'use strict';

const express = require('express');
const config = require('config');

const { jsonrpcValidator } = require(__dirname + '/src/Middleware/JsonRpcValidator.js');
const newAppController = require(__dirname + '/src/Middleware/NewAppController.js');
const { WavesAccount } = require( __dirname + '/src/Account.js');

const restApiConfig = config.get('restApi');
const dbConfig = config.get('db');
const nodeApiConfig = config.get('nodeApi');
const systemAccountConfig = config.get('systemAccount');

const app = express();
// for parsing application/json
app.use(express.json());
// for parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(jsonrpcValidator);

const dbConnection = require('mysql').createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.dbName,
    user: dbConfig.user,
    password: dbConfig.password,
});
try {
    const systemAccount = new WavesAccount(systemAccountConfig.seed, nodeApiConfig.chainId);
    app.post('/api/app/', newAppController(systemAccount, nodeApiConfig, dbConnection));
    app.listen(restApiConfig.port, () => console.log(`Listening on port ${restApiConfig.port}`));
} catch (e) {
    dbconnection.end();
}
