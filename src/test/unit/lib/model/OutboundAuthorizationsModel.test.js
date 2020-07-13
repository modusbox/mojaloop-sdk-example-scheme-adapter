/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Paweł Marzec - pawel.marzec@modusbox.com                         *
 **************************************************************************/

'use strict';

// we use a mock standard components lib to intercept and mock certain funcs
jest.mock('@mojaloop/sdk-standard-components');

const { uuid } = require('uuidv4');
const Model = require('@internal/model').OutboundAuthorizationsModel;
const { MojaloopRequests } = require('@mojaloop/sdk-standard-components');
const defaultConfig = require('./data/defaultConfig');
const mockLogger = require('../../mockLogger');


describe('authorizationsModel', () => {
    let cacheKey;
    let data;
    let modelConfig;

    const subId = 123;
    let handler = null;

    afterEach(() => {
        MojaloopRequests.__postAuthorizations = jest.fn(() => Promise.resolve());
    });

    /**
     *
     * @param {Object} opts
     * @param {Number} opts.expirySeconds
     * @param {Object} opts.delays
     * @param {Number} delays.requestQuotes
     * @param {Number} delays.prepareTransfer
     * @param {Object} opts.rejects
     * @param {boolean} rejects.quoteResponse
     * @param {boolean} rejects.transferFulfils
     */
    

    beforeEach(async () => {
        modelConfig = {
            logger: mockLogger({app: 'OutboundAuthorizationsModel-test'}),

            // there is no need to mock redis but only Cache
            cache: {
                get: jest.fn(() => Promise.resolve(data)),
                set: jest.fn(() => Promise.resolve),

                // mock subscription and store handler
                subscribe: jest.fn(async (channel, h) => {
                    handler = jest.fn(h);
                    return subId;
                }),
            
                // mock publish and call stored handler
                publish: jest.fn(async (channel, message) => await handler(channel, message, subId)),

                unsubscribe: jest.fn(() => Promise.resolve())
            },
            ...defaultConfig
        };
        data = {the: 'mocked data', toParticipantId: 'pisp'};
    });

    describe('create', () => {
        test('proper creation of model', async () => {
            const model = await Model.create(data, cacheKey, modelConfig);

            expect(model.state).toBe('start');
            
            // model's methods layout
            const methods = [
                'run', 'getResponse',
                'onRequestAuthorization', 'onAuthorizationReceived'
            ];

            methods.forEach((method) => expect(typeof model[method]).toEqual('function'));
        });
    });

    describe('loadFromCache', () => {
        it('should load properly', async () => {
            modelConfig.cache.get = jest.fn(() => Promise.resolve({source: 'yes I came from the cache'}));

            const model = await Model.loadFromCache(cacheKey, modelConfig);
            expect(model.context.data.source).toEqual('yes I came from the cache');
            expect(model.context.cache.get).toBeCalledTimes(1);
            expect(model.context.cache.get).toBeCalledWith(cacheKey);
        });
    });

    describe('getResponse', () => {
        
        it('should remap currentState', async () => {
            const model = await Model.create(data, cacheKey, modelConfig);
            const states = model.allStates();

            // should remap for all states except 'init' and 'none'
            states.filter((s) => s !== 'init' && s !== 'none').forEach((state) => {
                model.context.data.currentState = state;
                const result = model.getResponse();
                expect(result.currentState).toEqual(Model.mapCurrentState[state]);
            });
            
        });

        it('should handle unexpected state', async() => {
            const model = await Model.create(data, cacheKey, modelConfig);
            
            // simulate lack of state by undefined property
            delete model.context.data.currentState;

            const resp = model.getResponse();
            expect(resp.currentState).toEqual(Model.mapCurrentState.errored);

            // ensure that we log the problem properly
            expect(modelConfig.logger.log).toBeCalledWith(`Authorization model response being returned from an unexpected state: ${undefined}. Returning ERROR_OCCURRED state`);
        });
    });

    describe('notificationChannel', () => {
        it('should validate input', () => {
            const invalidIds = [
                null,
                undefined,
                ''
            ];
            invalidIds.forEach((id) => {
                const invocation = () => Model.notificationChannel(id);
                expect(invocation).toThrow('OutboundAuthorizationsModel.notificationChannel: \'id\' parameter is required');
            });
        });

        it('should generate proper channel name', () => {
            const id = uuid();
            expect(Model.notificationChannel(id)).toEqual(`authorizations_${id}`);
        });

    });

    describe('onAuthorizationReceived', () => {
        it('should validate input', async () => {
            const invalidMessages = [
                null,
                undefined,
                {},
                {body: null}
            ];
            const model = await Model.create(data, cacheKey, modelConfig);

            const testCases = invalidMessages.map(async (msg) => {
                expect(() => model.onAuthorizationReceived(msg))
                    .rejects.ToEqual(new Error('OutboundAuthorizationsModel.onAuthorizationReceived: invalid \'message\' parameter is required'));
            });

            await Promise.allSettled(testCases);
        });

        it('should properly setup context.data', async () => {
            const message = {
                body: {
                    Iam: 'the-body'
                }
            };
            const model = await Model.create(data, cacheKey, modelConfig);
            await model.onAuthorizationReceived(message);

            expect(model.context.data).toEqual(message.body);
        });
    });

    describe('onRequestAuthorization', () => {

        it('should implement happy flow', async () => {
            data.transactionRequestId = uuid();
            const channel = Model.notificationChannel(data.transactionRequestId);
            const model = await Model.create(data, cacheKey, modelConfig);
            const { cache } = model.context;
            // mock workflow execution which is tested in separate case
            model.run = jest.fn(() => Promise.resolve());

            // invoke transition handler
            await model.onRequestAuthorization();

            // subscribe should be called only once
            expect(cache.subscribe).toBeCalledTimes(1);

            // subscribe should be done to proper notificationChannel
            expect(cache.subscribe.mock.calls[0][0]).toEqual(channel);

            // check invocation of request.postAuthorizations
            expect(MojaloopRequests.__postAuthorizations).toBeCalledWith(Model.buildPostAuthorizationsRequest(data, modelConfig), data.toParticipantId);

            // ensure handler wasn't called before publishing the message
            expect(handler).not.toBeCalled();

            // ensure that cache.unsubscribe does not happened
            expect(cache.unsubscribe).not.toBeCalled();

            // fire publication to channel with given message
            const message = {
                body: {
                    Iam: 'the-body',
                    transactionRequestId: model.context.data.transactionRequestId
                }
            };
            await cache.publish(channel, message);

            // handler should be called only once
            expect(handler).toBeCalledTimes(1);

            // the workflow should be run only once
            expect(model.run).toBeCalledTimes(1);
            expect(model.run).toBeCalledWith(message);

            // handler should unsubscribe from notification channel
            expect(cache.unsubscribe).toBeCalledTimes(1);
            expect(cache.unsubscribe).toBeCalledWith(subId);
        });

        it('should unsubscribe from cache in case when error happens in workflow run', async () => {
            data.transactionRequestId = uuid();
            const channel = Model.notificationChannel(data.transactionRequestId);
            const model = await Model.create(data, cacheKey, modelConfig);
            const { cache } = model.context;

            // simulate error
            model.run = jest.fn(() => Promise.reject('workflow failed'));
            let theError = null;
            try {
                // invoke transition handler
                await model.onRequestAuthorization();

                // fire publication to channel with given message
                const message = {
                    body: {
                        Iam: 'the-body',
                        transactionRequestId: data.transactionRequestId
                    }
                };
                await cache.publish(channel, message);

            } catch(error) {
                theError = error;
            }
            expect(theError).toEqual('workflow failed');
            expect(cache.unsubscribe).toBeCalledTimes(1);
            expect(cache.unsubscribe).toBeCalledWith(subId);
        });

        it('should unsubscribe from cache in case when error happens Mojaloop requests', async () => {
            // simulate error
            MojaloopRequests.__postAuthorizations = jest.fn(() => Promise.reject('postAuthorization failed'));
            data.transactionRequestId = uuid();

            const model = await Model.create(data, cacheKey, modelConfig);
            const { cache } = model.context;

            let theError = null;
            // invoke transition handler
            try {
                await model.onRequestAuthorization();
                throw new Error('this point should not be reached');
            } catch (error) {
                theError = error;
            }
            expect(theError).toEqual('postAuthorization failed');
            // handler should unsubscribe from notification channel
            expect(cache.unsubscribe).toBeCalledTimes(1);
            expect(cache.unsubscribe).toBeCalledWith(subId);
        });

    });

    describe('run workflow', () => {
        it('start', async () => {
            const model = await Model.create(data, cacheKey, modelConfig);
            
            model.requestAuthorization = jest.fn();
            model.getResponse = jest.fn(() => Promise.resolve({the: 'response'}));

            model.context.data.currentState = 'start';
            const result = await model.run();
            expect(result).toEqual({the: 'response'});
            expect(model.requestAuthorization).toBeCalledTimes(1);
            expect(model.getResponse).toBeCalledTimes(1);
            expect(model.context.logger.log).toBeCalledWith(`Authorization requested for ${model.context.data.transactionRequestId}`);
        });

        it('waitingForAuthorization', async () => {
            const model = await Model.create(data, cacheKey, modelConfig);
            
            model.authorizationReceived = jest.fn();
            model.getResponse = jest.fn(() => Promise.resolve({the: 'response'}));
            
            model.context.data.currentState = 'waitingForAuthorization';
            const result = await model.run({the: 'message'});
            
            expect(result).toEqual({the: 'response'});
            expect(model.authorizationReceived).toBeCalledTimes(1);
            expect(model.authorizationReceived).toBeCalledWith({the: 'message'});
            expect(model.getResponse).toBeCalledTimes(1);
            expect(model.context.logger.log).toBeCalledWith(`Authorization received for ${model.context.data.transactionRequestId}`);
        });

        it('succeeded', async () => {
            const model = await Model.create(data, cacheKey, modelConfig);
            
            model.getResponse = jest.fn(() => Promise.resolve({the: 'response'}));
            
            model.context.data.currentState = 'succeeded';
            const result = await model.run({the: 'message'});
            
            expect(result).toEqual({the: 'response'});
            expect(model.getResponse).toBeCalledTimes(1);
            expect(model.context.logger.log).toBeCalledWith('Authorization completed successfully');
        });

        it('errored', async () => {
            const model = await Model.create(data, cacheKey, modelConfig);
            
            model.getResponse = jest.fn(() => Promise.resolve({the: 'response'}));
            
            model.context.data.currentState = 'errored';
            const result = await model.run({the: 'message'});
            
            expect(result).toBeFalsy();
            expect(model.getResponse).not.toBeCalled();
            expect(model.context.logger.log).toBeCalledWith('State machine in errored state');
        });

        it('should handle errors', async () => {
            const model = await Model.create(data, cacheKey, modelConfig);
            
            model.requestAuthorization = jest.fn(() => {
                const err = new Error('requestAuthorization failed');
                err.authorizationState = 'some';
                return Promise.reject(err);
            });
            model.error = jest.fn();
            model.context.data.currentState = 'start';
            
            let theError = null;
            try {
                await model.run();
                throw new Error('this point should not be reached');
            } catch(error) {
                theError = error;
            }
            // check propagation of original error
            expect(theError.message).toEqual('requestAuthorization failed');

            // ensure we start transition to errored state
            expect(model.error).toBeCalledTimes(1);
        });
    });
});