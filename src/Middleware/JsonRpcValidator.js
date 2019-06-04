'use strict';

const jsonrpc = require('jsonrpc-lite');

const INVALID_REQUEST_ERROR_CODE = -32600;
const INVALID_REQUEST_ERROR_TEXT = 'Invalid request format';

exports.jsonrpcValidator = function (req, res, next) {
    const jsonrpcReq = jsonrpc.parseObject(req.body);
    if (jsonrpcReq.type === 'invalid') {
        const error = new jsonrpc.JsonRpcError(INVALID_REQUEST_ERROR_TEXT, INVALID_REQUEST_ERROR_CODE);
        res.status(400).json(jsonrpc.error(INVALID_REQUEST_ERROR_CODE, error));
        return;
    }
    next();
};
