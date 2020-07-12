/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Paweł Marzec - pawel.marzec@modusbox.com                         *
 **************************************************************************/

'use strict';

const util = require('util');
const { uuid } = require('uuidv4');
const { MojaloopRequests } = require('@mojaloop/sdk-standard-components');
const PSM = require('./common').PersistentStateMachine;


const specStateMachine = {
    init: 'start',
    transitions: [
        { name: 'init', from: 'none', to: 'start' },
        { name: 'requestAuthorization', from: 'start', to: 'waitingForAuthorization' },
        { name: 'authorizationReceived', from: 'waitingForAuthorization', to: 'succeeded'},
        { name: 'error', from: '*', to: 'errored' },    
    ],
    methods: {
        // workflow methods
        run,
        getResponse,

        // specific transitions handlers methods
        onRequestAuthorization,
        onAuthorizationReceived
    }
};

/**
 * runs the workflow
 */
async function run(message) {
    const { data, logger } = this.context;
    try {
        // run transitions based on incoming state
        switch(data.currentState) {
            case 'start':
                // the first transition is requestAuthorization
                await this.requestAuthorization();
                logger.log(`Authorization requested for ${data.transactionRequestId}`);
                break;

            case 'waitingForAuthorization':
                await this.authorizationReceived();
                logger.log(`Authorization received for ${data.transactionRequestId}`);
                break;

            case 'succeeded':
                // all steps complete so return
                logger.log('Authorization completed successfully');
                return this.getResponse();

            case 'errored':
                // stopped in errored state
                logger.log('State machine in errored state');
                return;
        }

        // now call ourselves recursively to deal with the next transition
        // in this scenario defined in switch statement ^ this part of code is not reachable because of return in every case !!!
        // logger.log(`Authorization model state machine transition completed in state: ${this.state}. Recursing to handle next transition.`);
        return this.run();

    } catch (err) {
        logger.log(`Error running authorizations model: ${util.inspect(err)}`);

        // as this function is recursive, we don't want to error the state machine multiple times
        if(data.currentState !== 'errored') {
            // err should not have a authorizationState property here!
            if(err.authorizationState) {
                logger.log('State machine is broken');
            }
            // transition to errored state
            await this.error(err);

            // avoid circular ref between authorizationState.lastError and err
            err.authorizationState = JSON.parse(JSON.stringify(this.getResponse()));
        }
        throw err;
    }
}


const mapCurrentState = {
    start: 'WAITING_FOR_AUTHORIZATION_REQUEST',
    waitingForAuthorization: 'WAITING_FOR_AUTHORIZATION_RESPONSE',
    succeeded: 'COMPLETED',
    errored: 'ERROR_OCCURRED'
};


/**
 * Returns an object representing the final state of the authorization suitable for the outbound API
 *
 * @returns {object} - Response representing the result of the authorization process
 */
function getResponse() {
    const { data, logger } = this.context;
    let resp = { ...data };

    // project some of our internal state into a more useful
    // representation to return to the SDK API consumer
    resp.currentState = mapCurrentState[data.currentState];

    // handle unexpected state
    if(!resp.currentState) {
        logger.log(`Authorization model response being returned from an unexpected state: ${data.currentState}. Returning ERROR_OCCURRED state`);
        resp.currentState = mapCurrentState.errored;
    }

    return resp;
}

function notificationChannel(id) {
    // mvp validation
    if(!(id && id.toString().length > 0)) {
        throw new Error('OutboundAuthorizationsModel.notificationChannel: \'id\' parameter is required');
    }

    // channel name
    return `authorizations_${id}`;
}

/**
 * Requests Authorization
 * Starts the authorization process by sending a POST /authorizations request to switch;
 * than await for a notification on PUT /authorizations/<transactionRequestId> from the cache that the Authorization has been resolved 
 */

async function onRequestAuthorization() {
    const { data, cache, logger } = this.context;
    const { requests, config } = this.handlersContext;
    const channel = notificationChannel(data.transactionRequestId);
    let subId;

    try {
        // in InboundServer/handlers is implemented putAuthorizationsById handler where this event is fired
        subId = await cache.subscribe(channel, async (channel, message, sid) => {
            try { 
                // Not doing anything here. 
            } finally {
                cache.unsubscribe(sid);
            }

        });

        // TODO: Simulate a Inbound response caching the retrieved data to progress the state machine.
        cache.publish(channel, {'body': {'key': 'some_data'}});

    } catch(error) {
        cache.unsubscribe(subId);
        throw error;
    }
}

/**
 * Propagates the Authorization
 * we got the notification on PUT /authorizations/<transactionRequestId> @ InboundServer
 * so we can propagate it back to DFSP
 * 
 * 
 */
async function onAuthorizationReceived() {
    // NOTE: Doing nothing here since `this.run(message)` wasn't working for me.
}


function buildPostAuthorizationsRequest(data/** , config */) {
    // TODO: the request object must be valid to schema defined in sdk-standard-components
    const request = {
        ...data
    };

    return request;
}

/**
 * injects the config into state machine data
 * so it will be accessible to on transition notification handlers via `this.handlersContext`
 * 
 * @param {Object} config               - config to be injected into state machine data
 * @param {Object} specStateMachine     - specState machine to be altered
 * @returns {Object}                    - the altered specStateMachine
 */
function injectHandlersContext(config, specStateMachine) {
    // TODO: postAuthorizations is a mocked method until this feature arrive in MojaloopRequests
    return { 
        ...specStateMachine,
        data: {
            handlersContext: {
                config, // injects config property
                requests:  new MojaloopRequests({
                    logger: config.logger,
                    peerEndpoint: config.peerEndpoint,
                    alsEndpoint: config.alsEndpoint,
                    dfspId: config.dfspId,
                    tls: config.tls,
                    jwsSign: config.jwsSign,
                    jwsSignPutParties: config.jwsSignPutParties,
                    jwsSigningKey: config.jwsSigningKey,
                    wso2Auth: config.wso2Auth
                })
            }
        }
    };
}


/**
 * creates a new instance of state machine specified in specStateMachine ^
 * 
 * @param {Object} data     - payload data
 * @param {String} key      - the cache key where state machine will store the payload data after each transition
 * @param {Object} config   - the additional configuration for transition handlers
 */
async function create(data, key, config) {

    if(!data.hasOwnProperty('transactionRequestId')) {
        data.transactionRequestId = uuid();
    }

    const spec = injectHandlersContext(config, specStateMachine);
    return PSM.create(data, config.cache, key, config.logger, spec);
}


/**
 * loads state machine from cache by given key and specify the additional config for transition handlers
 * @param {String} key      - the cache key used to retrieve the state machine from cache
 * @param {Object} config   - the additional configuration for transition handlers
 */
async function loadFromCache(key, config) {
    const customCreate = async (data, cache, key /**, logger, stateMachineSpec **/) => create(data, key, config);
    return PSM.loadFromCache(config.cache, key, config.logger, specStateMachine, customCreate);
}

module.exports = {
    create,
    loadFromCache,
    notificationChannel,
    
    // exports for testing purposes
    mapCurrentState,         
    buildPostAuthorizationsRequest
};