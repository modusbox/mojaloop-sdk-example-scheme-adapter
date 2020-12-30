/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 *  CONTRIBUTORS:                                                         *
 *       Steven Oderayi - steven.oderayi@modusbox.com                     *
 *       Paweł Marzec - pawel.marzec@modusbox.com                         *
 *       Sridhar Voruganti - sridhar.voruganti@modusbox.com               *
 **************************************************************************/

'use strict';

const util = require('util');
const Model = require('@internal/model').InboundTransfersModel;
const AuthorizationsModel = require('@internal/model').OutboundAuthorizationsModel;
const ThirdpartyTrxnModelIn = require('@internal/model').InboundThirdpartyTransactionModel;
const ThirdpartyTrxnModelOut = require('@internal/model').OutboundThirdpartyTransactionModel;
const PartiesModel = require('@internal/model').PartiesModel;

/**
 * Handles a GET /authorizations/{id} request
 */
const getAuthorizationsById = async (ctx) => {
    // kick off an asyncronous operation to handle the request
    (async () => {
        try {
            if(ctx.state.conf.enableTestFeatures) {
                const cache = ctx.state.cache;
                // we are in test mode so cache the request
                const req = {
                    headers: ctx.request.headers
                };
                const res = await cache.set(`${cache.REQUEST_PREFIX}${ctx.state.path.params.ID}`, req);
                ctx.state.logger.log(`Caching request: ${util.inspect(res)}`);
            }

            // use the transfers model to execute asynchronous stages with the switch
            const model = new Model({
                ...ctx.state.conf,
                cache: ctx.state.cache,
                logger: ctx.state.logger,
                wso2Auth: ctx.state.wso2Auth,
            });

            const sourceFspId = ctx.request.headers['fspiop-source'];

            // use the model to handle the request
            const response = await model.getAuthorizations(ctx.state.path.params.ID, sourceFspId);

            // log the result
            ctx.state.logger.push({ response }).log('Inbound transfers model handled GET /parties/{idType}/{idValue} request');
        }
        catch(err) {
            // nothing we can do if an error gets thrown back to us here apart from log it and continue
            ctx.state.logger.push({ err }).log('Error handling GET /parties/{idType}/{idValue}');
        }
    })();

    // Note that we will have passed request validation, JWS etc... by this point
    // so it is safe to return 202
    ctx.response.status = 202;
    ctx.response.body = '';
};

/**
 * Handles POST /authorizations request
 */
const postAuthorizations = async (ctx) => {
    // kick off an asyncronous operation to handle the request
    (async () => {
        try {
            if (ctx.state.conf.enableTestFeatures) {
                const cache = ctx.state.cache;
                // we are in test mode so cache the request
                const req = {
                    headers: ctx.request.headers,
                    data: ctx.request.body
                };
                const res = await ctx.state.cache.set(`${cache.REQUEST_PREFIX}${ctx.request.body.transactionRequestId}`, req);
                ctx.state.logger.log(`Caching request : ${util.inspect(res)}`);
            }
            // use the transfers model to execute asynchronous stages with the switch
            const thirdpartyTrxnModelIn = new ThirdpartyTrxnModelIn({
                ...ctx.state.conf,
                cache: ctx.state.cache,
                logger: ctx.state.logger,
                wso2Auth: ctx.state.wso2Auth,
            });

            const sourceFspId = ctx.request.headers['fspiop-source'];

            // use the model to handle the request
            const response = await thirdpartyTrxnModelIn.postAuthorizations(ctx.request.body, sourceFspId);

            // log the result
            ctx.state.logger.push({ response }).log('Inbound Third party transaction model handled POST /authorizations request');
        }
        catch (err) {
            // nothing we can do if an error gets thrown back to us here apart from log it and continue
            ctx.state.logger.push({ err }).log('Error handling POST /authorizations}');
        }
    })();

    // Note that we will have passed request validation, JWS etc... by this point
    // so it is safe to return 202
    ctx.response.status = 202;
    ctx.response.body = '';
};

/**
 * Handles a GET /participants/{idType}/{idValue} request
 */
const getParticipantsByTypeAndId = async (ctx) => {
    // kick off an asynchronous operation to handle the request
    (async () => {
        try {
            // use the transfers model to execute asynchronous stages with the switch
            const model = new Model({
                ...ctx.state.conf,
                cache: ctx.state.cache,
                logger: ctx.state.logger,
                wso2Auth: ctx.state.wso2Auth,
            });

            const sourceFspId = ctx.request.headers['fspiop-source'];

            // use the model to handle the request
            const response = await model.getParticipants(ctx.state.path.params.Type,
                ctx.state.path.params.ID, ctx.state.path.params.SubId, sourceFspId);

            // log the result
            ctx.state.logger.push({ response }).log('Inbound transfers model handled GET /participants/{idType}/{idValue}');
        }
        catch(err) {
            // nothing we can do if an error gets thrown back to us here apart from log it and continue
            ctx.state.logger.push({ err }).log('Error handling GET /participants/{idType}/{idValue}');
        }
    })();

    // Note that we will have passed request validation, JWS etc... by this point
    // so it is safe to return 202
    ctx.response.status = 202;
    ctx.response.body = '';
};


/**
 * Handles a GET /parties/{idType}/{idValue} request
 */
const getPartiesByTypeAndId = async (ctx) => {
    // kick off an asyncronous operation to handle the request
    (async () => {
        try {
            if(ctx.state.conf.enableTestFeatures) {
                const cache = ctx.state.cache;
                // we are in test mode so cache the request
                const req = {
                    headers: ctx.request.headers
                };
                const res = await cache.set(`${cache.REQUEST_PREFIX}${ctx.state.path.params.ID}`, req);
                ctx.state.logger.log(`Caching request: ${util.inspect(res)}`);
            }

            // use the transfers model to execute asynchronous stages with the switch
            const model = new Model({
                ...ctx.state.conf,
                cache: ctx.state.cache,
                logger: ctx.state.logger,
                wso2Auth: ctx.state.wso2Auth,
            });

            const sourceFspId = ctx.request.headers['fspiop-source'];

            // use the model to handle the request
            const response = await model.getParties(ctx.state.path.params.Type, ctx.state.path.params.ID,
                ctx.state.path.params.SubId, sourceFspId);

            // log the result
            ctx.state.logger.push({ response }).log('Inbound transfers model handled GET /parties/{idType}/{idValue} request');
        }
        catch(err) {
            // nothing we can do if an error gets thrown back to us here apart from log it and continue
            ctx.state.logger.push({ err }).log('Error handling GET /parties/{idType}/{idValue}');
        }
    })();

    // Note that we will have passed request validation, JWS etc... by this point
    // so it is safe to return 202
    ctx.response.status = 202;
    ctx.response.body = '';
};


/**
 * Handles a POST /parties/{idType}/{idValue} request
 */
const postPartiesByTypeAndId = (ctx) => {
    // creation of parties not supported by SDK
    ctx.response.status = 501;
    ctx.response.body = '';
};


/**
 * Handles a POST /quotes request
 */
const postQuotes = async (ctx) => {
    // kick off an asyncronous operation to handle the request
    (async () => {
        try {
            if(ctx.state.conf.enableTestFeatures) {
                const cache = ctx.state.cache;
                // we are in test mode so cache the request
                const req = {
                    headers: ctx.request.headers,
                    data: ctx.request.body
                };
                const res = await cache.set(`${cache.REQUEST_PREFIX}${ctx.request.body.quoteId}`, req);
                ctx.state.logger.log(`Caching request: ${util.inspect(res)}`);
            }

            // use the transfers model to execute asynchronous stages with the switch
            const model = new Model({
                ...ctx.state.conf,
                cache: ctx.state.cache,
                logger: ctx.state.logger,
                wso2Auth: ctx.state.wso2Auth,
            });

            const sourceFspId = ctx.request.headers['fspiop-source'];

            // use the model to handle the request
            const response = await model.quoteRequest(ctx.request.body, sourceFspId);

            // log the result
            ctx.state.logger.push({ response }).log('Inbound transfers model handled POST /quotes request');
        }
        catch(err) {
            // nothing we can do if an error gets thrown back to us here apart from log it and continue
            ctx.state.logger.push({ err }).log('Error handling POST /quotes');
        }
    })();

    // Note that we will have passed request validation, JWS etc... by this point
    // so it is safe to return 202
    ctx.response.status = 202;
    ctx.response.body = '';
};


/**
 * Handles a POST /transfers request
 */
const postTransfers = async (ctx) => {
    // kick off an asyncronous operation to handle the request
    (async () => {
        try {
            if(ctx.state.conf.enableTestFeatures) {
                const cache = ctx.state.cache;
                // we are in test mode so cache the request
                const req = {
                    headers: ctx.request.headers,
                    data: ctx.request.body
                };
                const res = await cache.set(`${cache.REQUEST_PREFIX}${ctx.request.body.transferId}`, req);
                ctx.state.logger.log(`Caching request: ${util.inspect(res)}`);
            }

            // use the transfers model to execute asynchronous stages with the switch
            const model = new Model({
                ...ctx.state.conf,
                cache: ctx.state.cache,
                logger: ctx.state.logger,
                wso2Auth: ctx.state.wso2Auth,
            });

            const sourceFspId = ctx.request.headers['fspiop-source'];

            // use the model to handle the request
            const response = await model.prepareTransfer(ctx.request.body, sourceFspId);

            // log the result
            ctx.state.logger.push({ response }).log('Inbound transfers model handled POST /transfers request');
        }
        catch(err) {
            // nothing we can do if an error gets thrown back to us here apart from log it and continue
            ctx.state.logger.push({ err }).log('Error handling POST /transfers');
        }
    })();

    // Note that we will have passed request validation, JWS etc... by this point
    // so it is safe to return 202
    ctx.response.status = 202;
    ctx.response.body = '';
};

/**
 * Handles a GET /transfers/{ID} request
 */
const getTransfersById = async (ctx) => {
    // kick off an asyncronous operation to handle the request
    (async () => {
        try {
            if (ctx.state.conf.enableTestFeatures) {
                // we are in test mode so cache the request
                const req = {
                    headers: ctx.request.headers
                };
                const res = await ctx.state.cache.set(
                    `request_${ctx.state.path.params.ID}`, req);
                ctx.state.logger.log(`Caching request : ${util.inspect(res)}`);
            }

            // use the transfers model to execute asynchronous stages with the switch
            const model = new Model({
                ...ctx.state.conf,
                cache: ctx.state.cache,
                logger: ctx.state.logger,
                wso2Auth: ctx.state.wso2Auth,
            });

            const sourceFspId = ctx.request.headers['fspiop-source'];

            // use the model to handle the request
            const response = await model.getTransfer(ctx.state.path.params.ID,
                sourceFspId);

            // log the result
            ctx.state.logger.push({response}).
                log('Inbound transfers model handled GET /transfers/{ID} request');
        }
        catch(err) {
            // nothing we can do if an error gets thrown back to us here apart from log it and continue
            ctx.state.logger.push({ err }).log('Error handling GET /transfers/{ID}');
        }
    })();

    // Note that we will have passed request validation, JWS etc... by this point
    // so it is safe to return 202
    ctx.response.status = 202;
    ctx.response.body = '';
};

/**
 * Handles a POST /transactionRequests request
 */
const postTransactionRequests = async (ctx) => {
    // kick off an asyncronous operation to handle the request
    (async () => {
        try {
            if(ctx.state.conf.enableTestFeatures) {
                const cache = ctx.state.cache;
                // we are in test mode so cache the request
                const req = {
                    headers: ctx.request.headers,
                    data: ctx.request.body
                };
                const res = await cache.set(`${cache.REQUEST_PREFIX}${ctx.request.body.transactionRequestId}`, req);
                ctx.state.logger.log(`Caching request: ${util.inspect(res)}`);
            }

            // use the transfers model to execute asynchronous stages with the switch
            const model = new Model({
                ...ctx.state.conf,
                cache: ctx.state.cache,
                logger: ctx.state.logger,
                wso2Auth: ctx.state.wso2Auth,
            });

            const sourceFspId = ctx.request.headers['fspiop-source'];

            // use the model to handle the request
            const response = await model.transactionRequest(ctx.request.body, sourceFspId);

            // log the result
            ctx.state.logger.push({ response }).log('Inbound transfers model handled POST /transactionRequests request');
        }
        catch(err) {
            // nothing we can do if an error gets thrown back to us here apart from log it and continue
            ctx.state.logger.push({ err }).log('Error handling POST /transactionRequests');
        }
    })();

    // Note that we will have passed request validation, JWS etc... by this point
    // so it is safe to return 202
    ctx.response.status = 202;
    ctx.response.body = '';
};

/**
 * Handles a PUT /authorizations/{id}. This is a response to a GET /authorizations/{ID} or POST /authorizations/{ID}
 * request.
 */
const putAuthorizationsById = async (ctx) => {
    if(ctx.state.conf.enableTestFeatures) {
        const cache = ctx.state.cache;
        // we are in test mode so cache the request
        const req = {
            headers: ctx.request.headers,
            data: ctx.request.body
        };
        const res = await cache.set(`${cache.CALLBACK_PREFIX}${ctx.state.path.params.ID}`, req);
        ctx.state.logger.log(`Caching request: ${util.inspect(res)}`);
    }

    const idValue = ctx.state.path.params.ID;

    const authorizationChannel = ctx.state.conf.enablePISPMode
        ? AuthorizationsModel.notificationChannel(idValue)
        : `otp_${idValue}`;

    await ctx.state.cache.publish(authorizationChannel, {
        type: 'authorizationsResponse',
        data: ctx.request.body,
        headers: ctx.request.headers
    });

    ctx.response.status = 200;
};

/**
 * Handles a PUT /participants/{ID}. This is a response to a POST /participants request
 */
const putParticipantsById = async (ctx) => {
    if(ctx.state.conf.enableTestFeatures) {
        const cache = ctx.state.cache;
        // we are in test mode so cache the request
        const req = {
            headers: ctx.request.headers,
            data: ctx.request.body
        };
        const res = await cache.set(`${cache.CALLBACK_PREFIX}${ctx.state.path.params.ID}`, req);
        ctx.state.logger.log(`Caching callback: ${util.inspect(res)}`);
    }

    // publish an event onto the cache for subscribers to action
    await ctx.state.cache.publish(`ac_${ctx.state.path.params.ID}`, {
        type: 'accountsCreationSuccessfulResponse',
        data: ctx.request.body
    });

    ctx.response.status = 200;
};


/**
 * Handles a PUT /participants/{ID}/error. This is an error response to a POST /participants request
 */
const putParticipantsByIdError = async (ctx) => {
    if(ctx.state.conf.enableTestFeatures) {
        const cache = ctx.state.cache;
        // we are in test mode so cache the request
        const req = {
            headers: ctx.request.headers,
            data: ctx.request.body
        };
        const res = await cache.set(`${cache.CALLBACK_PREFIX}${ctx.state.path.params.ID}`, req);
        ctx.state.logger.log(`Caching callback: ${util.inspect(res)}`);
    }

    // publish an event onto the cache for subscribers to action
    await ctx.state.cache.publish(`ac_${ctx.state.path.params.ID}`, {
        type: 'accountsCreationErrorResponse',
        data: ctx.request.body
    });

    ctx.response.status = 200;
    ctx.response.body = '';
};


/**
 * Handles a PUT /participants/{idType}/{idValue} request
 */
const putParticipantsByTypeAndId = async (ctx) => {
    // SDK does not make participants requests so we should not expect any calls to this method
    ctx.response.status = 501;
    ctx.response.body = '';
};


/**
 * Handles a PUT /parties/{idType}/{IdValue}. This is a response to a GET /parties
 * request.
 */
const putPartiesByTypeAndId = async (ctx) => {
    if(ctx.state.conf.enableTestFeatures) {
        const cache = ctx.state.cache;
        // we are in test mode so cache the request
        const req = {
            headers: ctx.request.headers,
            data: ctx.request.body
        };
        const res = await cache.set(`${cache.CALLBACK_PREFIX}${ctx.state.path.params.ID}`, req);
        ctx.state.logger.log(`Caching request: ${util.inspect(res)}`);
    }

    const idType = ctx.state.path.params.Type;
    const idValue = ctx.state.path.params.ID;
    const idSubValue = ctx.state.path.params.SubId;

    // generate keys
    const cacheId = `${idType}_${idValue}` + (idSubValue ? `_${idSubValue}` : '');
    const channelName = PartiesModel.channelName(idType, idValue, idSubValue);

    // publish an event onto the cache for subscribers to action
    await ctx.state.cache.publish(cacheId, ctx.request.body);
    await ctx.state.cache.publish(channelName, ctx.request.body);

    ctx.response.status = 200;
};


/**
 * Handles a PUT /quotes/{ID}. This is a response to a POST /quotes request
 */
const putQuoteById = async (ctx) => {
    if(ctx.state.conf.enableTestFeatures) {
        const cache = ctx.state.cache;
        // we are in test mode so cache the request
        const req = {
            headers: ctx.request.headers,
            data: ctx.request.body
        };
        const res = await cache.set(`${cache.CALLBACK_PREFIX}${ctx.state.path.params.ID}`, req);
        ctx.state.logger.log(`Caching callback: ${util.inspect(res)}`);
    }

    // publish an event onto the cache for subscribers to action
    await ctx.state.cache.publish(`qt_${ctx.state.path.params.ID}`, {
        type: 'quoteResponse',
        data: ctx.request.body,
        headers: ctx.request.headers
    });

    ctx.response.status = 200;
};

/**
 * Handles a PUT /quotes/{ID}. This is a response to a POST /quotes request
 */
const putTransactionRequestsById = async (ctx) => {
    if(ctx.state.conf.enableTestFeatures) {
        const cache = ctx.state.cache;
        // we are in test mode so cache the request
        const req = {
            headers: ctx.request.headers,
            data: ctx.request.body
        };
        const res = await cache.set(`${cache.CALLBACK_PREFIX}${ctx.state.path.params.ID}`, req);
        ctx.state.logger.log(`Caching callback: ${util.inspect(res)}`);
    }

    // publish an event onto the cache for subscribers to action
    await ctx.state.cache.publish(`txnreq_${ctx.state.path.params.ID}`, {
        type: 'transactionRequestResponse',
        data: ctx.request.body,
        headers: ctx.request.headers
    });

    ctx.response.status = 200;
};

/**
 * Handles a PUT /transfers/{ID}. This is a response to a POST|PATCH|GET /transfers request
 */
const putTransfersById = async (ctx) => {
    if(ctx.state.conf.enableTestFeatures) {
        const cache = ctx.state.cache;
        // we are in test mode so cache the request
        const req = {
            headers: ctx.request.headers,
            data: ctx.request.body
        };
        const res = await cache.set(`${cache.CALLBACK_PREFIX}${ctx.state.path.params.ID}`, req);
        ctx.state.logger.log(`Caching callback: ${util.inspect(res)}`);
    }

    // publish an event onto the cache for subscribers to action
    await ctx.state.cache.publish(`tf_${ctx.state.path.params.ID}`, {
        type: 'transferFulfil',
        data: ctx.request.body
    });

    ctx.response.status = 200;
};


/**
 * Handles a PUT /parties/{Type}/{ID}/error request. This is an error response to a GET /parties/{Type}/{ID} request
 */
const putPartiesByTypeAndIdError = async(ctx) => {
    if(ctx.state.conf.enableTestFeatures) {
        const cache = ctx.state.cache;
        // we are in test mode so cache the request
        const req = {
            headers: ctx.request.headers,
            data: ctx.request.body
        };
        const res = await cache.set(`${cache.CALLBACK_PREFIX}${ctx.state.path.params.ID}`, req);
        ctx.state.logger.log(`Caching request: ${util.inspect(res)}`);
    }

    const idType = ctx.state.path.params.Type;
    const idValue = ctx.state.path.params.ID;
    const idSubValue = ctx.state.path.params.SubId;

    // publish an event onto the cache for subscribers to action
    // note that we publish the event the same way we publish a success PUT
    // the subscriber will notice the body contains an errorInformation property
    // and recognise it as an error response
    // generate keys
    const cacheId = `${idType}_${idValue}` + (idSubValue ? `_${idSubValue}` : '');
    const channelName = PartiesModel.channelName(idType, idValue, idSubValue);

    // publish an event onto the cache for subscribers to action
    await Promise.all([
        ctx.state.cache.publish(cacheId, ctx.request.body),
        ctx.state.cache.publish(channelName, ctx.request.body)
    ]);
    ctx.response.status = 200;
    ctx.response.body = '';
};


/**
 * Handles a PUT /quotes/{ID}/error request. This is an error response to a POST /quotes request
 */
const putQuotesByIdError = async(ctx) => {
    if(ctx.state.conf.enableTestFeatures) {
        const cache = ctx.state.cache;
        // we are in test mode so cache the request
        const req = {
            headers: ctx.request.headers,
            data: ctx.request.body
        };
        const res = await cache.set(`${cache.CALLBACK_PREFIX}${ctx.state.path.params.ID}`, req);
        ctx.state.logger.log(`Caching callback: ${util.inspect(res)}`);
    }

    // publish an event onto the cache for subscribers to action
    await ctx.state.cache.publish(`qt_${ctx.state.path.params.ID}`, {
        type: 'quoteResponseError',
        data: ctx.request.body
    });

    ctx.response.status = 200;
    ctx.response.body = '';
};


/**
 * Handles a PUT /transfers/{ID}/error. This is an error response to a POST /transfers request
 */
const putTransfersByIdError = async (ctx) => {
    if(ctx.state.conf.enableTestFeatures) {
        const cache = ctx.state.cache;
        // we are in test mode so cache the request
        const req = {
            headers: ctx.request.headers,
            data: ctx.request.body
        };
        const res = await cache.set(`${cache.CALLBACK_PREFIX}${ctx.state.path.params.ID}`, req);
        ctx.state.logger.log(`Caching callback: ${util.inspect(res)}`);
    }

    // publish an event onto the cache for subscribers to action
    await ctx.state.cache.publish(`tf_${ctx.state.path.params.ID}`, {
        type: 'transferError',
        data: ctx.request.body
    });

    ctx.response.status = 200;
    ctx.response.body = '';
};

/**
 * Handles a GET /bulkQuotes/{ID} request
 */
const getBulkQuotesById = async (ctx) => {
    // kick off an asyncronous operation to handle the request
    (async () => {
        try {
            if (ctx.state.conf.enableTestFeatures) {
                // we are in test mode so cache the request
                const req = {
                    headers: ctx.request.headers
                };
                const res = await ctx.state.cache.set(
                    `request_${ctx.state.path.params.ID}`, req);
                ctx.state.logger.log(`Caching request: ${util.inspect(res)}`);
            }

            // use the transfers model to execute asynchronous stages with the switch
            const model = new Model({
                ...ctx.state.conf,
                cache: ctx.state.cache,
                logger: ctx.state.logger,
                wso2Auth: ctx.state.wso2Auth,
            });

            const sourceFspId = ctx.request.headers['fspiop-source'];

            // use the model to handle the request
            const response = await model.getBulkQuote(ctx.state.path.params.ID,
                sourceFspId);

            // log the result
            ctx.state.logger.push({response}).
                log('Inbound transfers model handled GET /bulkQuotes/{ID} request');
        }
        catch(err) {
            // nothing we can do if an error gets thrown back to us here apart from log it and continue
            ctx.state.logger.push({ err }).log('Error handling GET /bulkQuotes/{ID}');
        }
    })();

    // Note that we will have passed request validation, JWS etc... by this point
    // so it is safe to return 202
    ctx.response.status = 202;
    ctx.response.body = '';
};

/**
 * Handles a POST /bulkQuotes request
 */
const postBulkQuotes = async (ctx) => {
    (async () => {
        try {
            if(ctx.state.conf.enableTestFeatures) {
                const cache = ctx.state.cache;
                // we are in test mode so cache the request
                const req = {
                    headers: ctx.request.headers,
                    data: ctx.request.body
                };
                const res = await cache.set(`${cache.REQUEST_PREFIX}${ctx.request.body.bulkQuoteId}`, req);
                ctx.state.logger.log(`Caching request: ${util.inspect(res)}`);
            }

            // use the transfers model to execute asynchronous stages with the switch
            const model = new Model({
                ...ctx.state.conf,
                cache: ctx.state.cache,
                logger: ctx.state.logger,
                wso2Auth: ctx.state.wso2Auth,
            });

            const sourceFspId = ctx.request.headers['fspiop-source'];

            // use the model to handle the request
            const response = await model.bulkQuoteRequest(ctx.request.body, sourceFspId);

            // log the result
            ctx.state.logger.push({ response }).log('Inbound transfers model handled POST /bulkQuotes request');
        }
        catch(err) {
            // nothing we can do if an error gets thrown back to us here apart from log it and continue
            ctx.state.logger.push({ err }).log('Error handling POST /bulkQuotes');
        }
    })();

    ctx.response.status = 202;
    ctx.response.body = '';
};

/**
 * Handles a PUT /bulkQuotes/{ID}. This is a response to a POST /bulkQuotes request
 */
const putBulkQuotesById = async (ctx) => {
    if(ctx.state.conf.enableTestFeatures) {
        const cache = ctx.state.cache;
        // we are in test mode so cache the request
        const req = {
            headers: ctx.request.headers,
            data: ctx.request.body
        };
        const res = await cache.set(`${cache.CALLBACK_PREFIX}${ctx.state.path.params.ID}`, req);
        ctx.state.logger.log(`Caching callback: ${util.inspect(res)}`);
    }

    // publish an event onto the cache for subscribers to action
    await ctx.state.cache.publish(`bulkQuotes_${ctx.state.path.params.ID}`, {
        type: 'bulkQuoteResponse',
        data: ctx.request.body,
        headers: ctx.request.headers
    });

    ctx.response.status = 200;
};

/**
 * Handles a PUT /bulkQuotes/{ID}/error request. This is an error response to a POST /bulkQuotes request
 */
const putBulkQuotesByIdError = async(ctx) => {
    if(ctx.state.conf.enableTestFeatures) {
        const cache = ctx.state.cache;
        // we are in test mode so cache the request
        const req = {
            headers: ctx.request.headers,
            data: ctx.request.body
        };
        const res = await cache.set(`${cache.CALLBACK_PREFIX}${ctx.state.path.params.ID}`, req);
        ctx.state.logger.log(`Caching callback: ${util.inspect(res)}`);
    }

    // publish an event onto the cache for subscribers to action
    await ctx.state.cache.publish(`bulkQuotes_${ctx.state.path.params.ID}`, {
        type: 'bulkQuoteResponseError',
        data: ctx.request.body
    });

    ctx.response.status = 200;
    ctx.response.body = '';
};

/**
 * Handles a GET /bulkTransfers/{ID} request
 */
const getBulkTransfersById = async (ctx) => {
    // kick off an asyncronous operation to handle the request
    (async () => {
        try {
            if (ctx.state.conf.enableTestFeatures) {
                // we are in test mode so cache the request
                const req = {
                    headers: ctx.request.headers
                };
                const res = await ctx.state.cache.set(
                    `request_${ctx.state.path.params.ID}`, req);
                ctx.state.logger.log(`Caching request : ${util.inspect(res)}`);
            }

            // use the transfers model to execute asynchronous stages with the switch
            const model = new Model({
                ...ctx.state.conf,
                cache: ctx.state.cache,
                logger: ctx.state.logger,
                wso2Auth: ctx.state.wso2Auth,
            });

            const sourceFspId = ctx.request.headers['fspiop-source'];

            // use the model to handle the request
            const response = await model.getBulkTransfer(ctx.state.path.params.ID,
                sourceFspId);

            // log the result
            ctx.state.logger.push({response}).
                log('Inbound transfers model handled GET /bulkTransfers/{ID} request');
        }
        catch(err) {
            // nothing we can do if an error gets thrown back to us here apart from log it and continue
            ctx.state.logger.push({ err }).log('Error handling GET /bulkTransfers/{ID}');
        }
    })();

    // Note that we will have passed request validation, JWS etc... by this point
    // so it is safe to return 202
    ctx.response.status = 202;
    ctx.response.body = '';
};

/**
 * Handles a POST /bulkTransfers request
 */
const postBulkTransfers = async (ctx) => {
    (async () => {
        try {
            if(ctx.state.conf.enableTestFeatures) {
                const cache = ctx.state.cache;
                // we are in test mode so cache the request
                const req = {
                    headers: ctx.request.headers,
                    data: ctx.request.body
                };
                const res = await cache.set(`${cache.REQUEST_PREFIX}${ctx.request.body.bulkTransferId}`, req);
                ctx.state.logger.log(`Caching request: ${util.inspect(res)}`);
            }

            // use the transfers model to execute asynchronous stages with the switch
            const model = new Model({
                ...ctx.state.conf,
                cache: ctx.state.cache,
                logger: ctx.state.logger,
                wso2Auth: ctx.state.wso2Auth,
            });

            const sourceFspId = ctx.request.headers['fspiop-source'];

            // use the model to handle the request
            const response = await model.prepareBulkTransfer(ctx.request.body, sourceFspId);

            // log the result
            ctx.state.logger.push({ response }).log('Inbound transfers model handled POST /bulkTransfers request');
        }
        catch(err) {
            // nothing we can do if an error gets thrown back to us here apart from log it and continue
            ctx.state.logger.push({ err }).log('Error handling POST /bulkTransfers');
        }
    })();

    ctx.response.status = 202;
    ctx.response.body = '';
};

/**
 * Handles a PUT /bulkTransfers/{ID}. This is a response to a POST /bulkTransfers request
 */
const putBulkTransfersById = async (ctx) => {
    if(ctx.state.conf.enableTestFeatures) {
        const cache = ctx.state.cache;
        // we are in test mode so cache the request
        const req = {
            headers: ctx.request.headers,
            data: ctx.request.body
        };
        const res = await cache.set(`${cache.CALLBACK_PREFIX}${ctx.state.path.params.ID}`, req);
        ctx.state.logger.log(`Caching callback: ${util.inspect(res)}`);
    }

    // publish an event onto the cache for subscribers to action
    await ctx.state.cache.publish(`bulkTransfer_${ctx.state.path.params.ID}`, {
        type: 'bulkTransferResponse',
        data: ctx.request.body,
        headers: ctx.request.headers
    });

    ctx.response.status = 200;
};

/**
 * Handles a PUT /bulkTransfers/{ID}/error request. This is an error response to a POST /bulkTransfers request
 */
const putBulkTransfersByIdError = async(ctx) => {
    if(ctx.state.conf.enableTestFeatures) {
        const cache = ctx.state.cache;
        // we are in test mode so cache the request
        const req = {
            headers: ctx.request.headers,
            data: ctx.request.body
        };
        const res = await cache.set(`${cache.CALLBACK_PREFIX}${ctx.state.path.params.ID}`, req);
        ctx.state.logger.log(`Caching callback: ${util.inspect(res)}`);
    }

    // publish an event onto the cache for subscribers to action
    await ctx.state.cache.publish(`bulkTransfer_${ctx.state.path.params.ID}`, {
        type: 'bulkTransferResponseError',
        data: ctx.request.body
    });

    ctx.response.status = 200;
    ctx.response.body = '';
};

/**
 * Handles PUT /thirdpartyRequests/transactions/{ID} request.
 * This is response to a POST /thirdpartyRequests/transactions request
 */
const putThirdPartyReqTransactionsById = async (ctx) => {
    if (ctx.state.conf.enableTestFeatures) {
        const cache = ctx.state.cache;
        // we are in test mode so cache the request
        const req = {
            headers: ctx.request.headers,
            data: ctx.request.body
        };
        const res = await ctx.state.cache.set(`${cache.CALLBACK_PREFIX}${ctx.state.path.params.ID}`, req);
        ctx.state.logger.log(`Caching callback: ${util.inspect(res)}`);
    }

    // publish an event onto the cache for subscribers to action
    await ThirdpartyTrxnModelOut.publishNotifications(ctx.state.cache, ctx.state.path.params.ID, {
        type: 'thirdpartyTransactionsReqResponse',
        data: ctx.request.body,
        headers: ctx.request.headers
    });

    ctx.response.status = 200;
};

/**
 * Handles PUT /thirdpartyRequests/transactions/{ID}/error.
 * This is error response to POST /thirdpartyRequests/transactions request
 */
const putThirdPartyReqTransactionsByIdError = async (ctx) => {
    if (ctx.state.conf.enableTestFeatures) {
        const cache = ctx.state.cache;
        // we are in test mode so cache the request
        const req = {
            headers: ctx.request.headers,
            data: ctx.request.body
        };
        const res = await ctx.state.cache.set(`${cache.CALLBACK_PREFIX}${ctx.state.path.params.ID}`, req);
        ctx.state.logger.log(`Caching callback: ${util.inspect(res)}`);
    }

    // publish an event onto the cache for subscribers to action
    await ThirdpartyTrxnModelOut.publishNotifications(ctx.state.cache, ctx.state.path.params.ID, {
        type: 'thirdpartyTransactionsReqErrorResponse',
        data: ctx.request.body,
        headers: ctx.request.headers
    });

    ctx.response.status = 200;
};

const healthCheck = async(ctx) => {
    ctx.response.status = 200;
    ctx.response.body = '';
};

module.exports = {
    '/': {
        get: healthCheck
    },
    '/authorizations': {
        post: postAuthorizations
    },
    '/authorizations/{ID}': {
        get: getAuthorizationsById,
        put: putAuthorizationsById
    },
    '/bulkQuotes': {
        post: postBulkQuotes
    },
    '/bulkQuotes/{ID}': {
        get: getBulkQuotesById,
        put: putBulkQuotesById
    },
    '/bulkQuotes/{ID}/error': {
        put: putBulkQuotesByIdError
    },
    '/bulkTransfers': {
        post: postBulkTransfers
    },
    '/bulkTransfers/{ID}': {
        get: getBulkTransfersById,
        put: putBulkTransfersById
    },
    '/bulkTransfers/{ID}/error': {
        put: putBulkTransfersByIdError
    },
    '/participants/{ID}': {
        put: putParticipantsById
    },
    '/participants/{Type}/{ID}': {
        put: putParticipantsByTypeAndId,
        get: getParticipantsByTypeAndId
    },
    '/participants/{Type}/{SubId}/{ID}': {
        put: putParticipantsByTypeAndId,
        get: getParticipantsByTypeAndId
    },
    '/participants/{ID}/error': {
        put: putParticipantsByIdError
    },
    '/parties/{Type}/{ID}': {
        post: postPartiesByTypeAndId,
        get: getPartiesByTypeAndId,
        put: putPartiesByTypeAndId
    },
    '/parties/{Type}/{ID}/{SubId}': {
        post: postPartiesByTypeAndId,
        get: getPartiesByTypeAndId,
        put: putPartiesByTypeAndId
    },
    '/parties/{Type}/{ID}/error': {
        put: putPartiesByTypeAndIdError
    },
    '/parties/{Type}/{ID}/{SubId}/error': {
        put: putPartiesByTypeAndIdError
    },
    '/quotes': {
        post: postQuotes
    },
    '/quotes/{ID}': {
        put: putQuoteById
    },
    '/quotes/{ID}/error': {
        put: putQuotesByIdError
    },
    '/transfers': {
        post: postTransfers
    },
    '/transfers/{ID}': {
        get: getTransfersById,
        put: putTransfersById,
        patch: putTransfersById
    },
    '/transfers/{ID}/error': {
        put: putTransfersByIdError
    },
    '/transactionRequests': {
        post: postTransactionRequests
    },
    '/transactionRequests/{ID}': {
        put: putTransactionRequestsById
    },
    '/thirdpartyRequests/transactions/{ID}': {
        put: putThirdPartyReqTransactionsById
    },
    '/thirdpartyRequests/transactions/{ID}/error': {
        put: putThirdPartyReqTransactionsByIdError
    }
};
