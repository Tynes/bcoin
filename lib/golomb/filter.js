/**
 * BIP 158 Filter for bcoin
 * Copyright (c) 2019, Braydon Fuller (MIT License).
 * Copyright (c) 2019, Javed Khan (MIT License).
 * Copyright (c) 2019, Mark Tyneway (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const Golomb = require('./golomb');
const {BufferSet} = require('buffer-map');
const assert = require('bsert');
const bio = require('bufio');
const {opcodes} = require('../script/common');
const {types} = require('./common');

// TODO: delete primitive/filter and
// filter tests in block-test

/*
 * Constants
 */

// NOTE: consensus.ZERO_HASH
const ZERO_HASH = Buffer.alloc(32);

class Filter extends Golomb {
  constructor() {
    super();

    this.type = types.BASIC;
    // NOTE: this.link is the filter header
    // cannot call it this.header because it
    // will overwrite Golomb.header
    // The Golomb datastructure shouldn't know
    // about the header, that method should be moved
    // to this class
    this.link = ZERO_HASH;
    this.block = ZERO_HASH;
  }

  fromOptions(options) {
    assert(options.block);
    assert(options.view);

    const {block, view} = options;

    this.block = block.hash();
    this.type = options.type || types.BASIC;

    switch (this.type) {
      case types.BASIC:
        this.fromBasic(block, view);
        break;
      default:
        return null;
    }

    // this must come after setting the gcs
    // parameters in fromBasic because the
    // filter header is h(hash(gcs filter) || prevBlockHash)
    if (options.prev)
      this.link = this.header(options.prev);

    return this;
  }

  // implementation logic for building the filter
  fromBasic(block, view) {
    const hash = block.hash();
    const key = hash.slice(0, 16);
    const items = new BufferSet();

    for (let i = 0; i < block.txs.length; i++) {
      const tx = block.txs[i];

      for (const output of tx.outputs) {
        if (output.script.length === 0)
          continue;

        // In order to allow the filters to later be committed
        // to within an OP_RETURN output, we ignore all
        // OP_RETURNs to avoid a circular dependency.
        if (output.script.raw[0] === opcodes.OP_RETURN)
          continue;

        items.add(output.script.raw);
      }
    }

    for (const [, coins] of view.map) {
      for (const [, coin] of coins.outputs) {
        if (coin.output.script.length === 0)
          continue;

        items.add(coin.output.script.raw);
      }
    }

    return this.fromItems(19, key, items);
  }

  // database key
  // return b(type || hash)
  toKey() {
    const bw = bio.write(1 + 32);
    bw.writeU8(this.type);
    bw.writeHash(this.block);

    return bw.render();
  }

  // database value
  // return b(header || filter)
  // rename to toRaw and call
  // super.toRaw? Also need a specific
  // wrapper for only returning super.toRaw
  // for the test vectors
  toValue() {
    const filter = this.toRaw();
    const size = 32 + filter.length;
    const bw = bio.write(size);

    bw.writeHash(this.link);
    bw.writeBytes(filter);

    return bw.render();
  }

  static fromOptions(options) {
    return new this().fromOptions(options);
  }

  // TODO: required for HTTP/RPC API
  // use util.revHex to make big endian
  toJSON() {
    return {};
  }
}

module.exports = Filter;
