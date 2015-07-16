'use strict';

import { Promise } from 'es6-promise';
import _ from 'lodash';
import { UTILS } from './utils';
import ENDPOINTS from './endpoints';

if (!global.fetch) {
    require('isomorphic-fetch');
}

// import fetch from 'isomorphic-fetch';

var HOST = 'https://www.bungie.net/platform/Destiny/'; // the is address to Bungie's API
var API_KEY = '';

/** FIXME: this could potentially be broken up into smaller blocks
 *
 * appends a spec to the lirary via iteration.
 *
 * lib - Object, intially empty.
 * item - Object, Destiny::Method.
 */
let createRequest = (lib, method) => {

    let template = _.template(method.url); // README: so that we can have parametised URLs

    lib[method.name] = function (params, headers) {
        return Promise.resolve(params)
            .then(params => {

                if (method.options && method.options.method === 'POST' && !_.isObject(headers)) {
                    UTILS.error(`You are not providing the headers needed for Destiny.${ method.name }() please see README.`);
                }

                // throw if parameters isn't an object
                if (!_.isObject(params)) {
                    UTILS.error(`Argument must be an Object containing: ${ method.required.join(', ') }.`);
                }

                // iterate over required fields to aggregate missing ones if not present in current call
                var missing = method.required
                    .filter(function (field) {
                        return !params.hasOwnProperty(field);
                    });

                // throw for any missing required fields
                if (missing.length > 0) {
                    UTILS.error(`Please provide [${ missing.join(', ') }] to Destiny.${ method.name }()`);
                }

                return params;
            })
            .then(params => fetch(HOST + template(params), _.assign(method.options, { 
                headers: function(){
                    if (API_KEY.length > 0){
                      headers['X-API-Key'] = API_KEY;
                    }
                    return headers;
                },
                body: JSON.stringify(params) 
            })))
            .then(UTILS.json)
            .then(UTILS.unwrapDestinyResponse);
    };

    return lib;
};

/**
 * preparing library for export
 */
let Destiny = (config) => {
    if (_.isString(config)) {
        HOST = config;
        console.log("Supplying host param as a string is deprecated, please use config object.");
    } else {
        if(_.isPlainObject(config)){
            let host = config.host || 'https://www.bungie.net/platform/Destiny/';
            if (!_.isString(host)){
                UTILS.error(`${ host } is not a valid URL.`);
                return;
            }
            HOST = config.host;

            let apiKey = config.apiKey || '';
            if (!_.isString(apiKey)){
                UTILS.error(`${ apiKey } is not a valid API Key.`);
                return;
            }
            API_KEY = apiKey;
        }
    }
    return ENDPOINTS.reduce(createRequest, {});
};

export default Destiny;
