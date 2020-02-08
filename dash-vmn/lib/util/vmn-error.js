/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';

/**
 * Future error codes (not implemented)
 * @private
 */
const errorCodes = {
    api_connection_error: 1,
    api_error: 2,
    authentication_error: 3,
    invalid_request_error: 4,
    rate_limit_error: 5,
    validation_error: 6
};

module.exports = {
    codes: errorCodes
};

