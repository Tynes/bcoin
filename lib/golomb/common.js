/**
 * BIP 158 Filter Options for bcoin
 * Copyright (c) 2019, Braydon Fuller (MIT License).
 * Copyright (c) 2019, Javed Khan (MIT License).
 * Copyright (c) 2019, Mark Tyneway (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const types = {
  'BASIC': 0x00
};

const typesByVal = {
  0x00: 'BASIC'
};

module.exports.types = types;
module.exports.typesByVal = typesByVal;
