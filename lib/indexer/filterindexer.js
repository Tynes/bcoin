/*!
 * filterindexer.js - filter indexer
 * Copyright (c) 2018, the bcoin developers (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const bdb = require('bdb');
const assert = require('bsert');
const Indexer = require('./indexer');
const consensus = require('../protocol/consensus');
const CoinView = require('../coins/coinview');
const Block = require('../primitives/block');
const Filter = require('../golomb/filter');

/**
 * FilterIndexer
 * @alias module:indexer.FilterIndexer
 * @extends Indexer
 */

class FilterIndexer extends Indexer {
  /**
   * Create a indexer
   * @constructor
   * @param {Object} options
   */

  constructor(options) {
    super('filter', options);

    this.db = bdb.create(this.options);
  }

  /**
   * Store genesis previous filter header.
   * @private
   * @returns {Promise}
   */

  async saveGenesis() {
    const genesis = Block.fromOptions(this.network.genesis);

    const filter = Filter.fromOptions({
      block: genesis,
      view: new CoinView()
    });

    filter.link = consensus.ZERO_HASH;

    // Genesis prev filter headers are defined to be zero hashes
    await this.blocks.writeFilter(genesis.prevBlock, filter.toValue());

    await super.saveGenesis();
  }

  /**
   * Index compact filters.
   * @private
   * @param {BlockMeta} meta
   * @param {Block} block
   * @param {CoinView} view
   */

  async indexBlock(meta, block, view) {
    const prev = await this.getFilterHeader(block.prevBlock);

    // TODO: parse config for different filter types
    // for now just index the Basic type

    // NOTE: Filter.fromBlock didn't work because
    // of the filter header needing the previous
    // block's hash to be calculated
    // Basic filter created by default if no type
    // property is passed into fromOptions
    const filter = Filter.fromOptions({
      block: block,
      view: view,
      prev: prev
    });

    // type || block hash
    const key = filter.toKey();

    // header || filter
    // TODO: refactor Golomb abstraction
    // so that filter.toRaw works as expected
    // still need a hook into Golomb.toRaw
    // for the test vectors
    const raw = filter.toValue();

    await this.blocks.writeFilter(key, raw);
  }

  /**
   * Prune compact filters.
   * @private
   * @param {BlockMeta} meta
   */

  async pruneBlock(meta) {
    await this.blocks.pruneFilter(meta.hash);
  }

  /**
   * Retrieve compact filter by hash.
   * @param {Hash} hash
   * @param {Number} type
   * @returns {Promise} - Returns {@link Filter}.
   */

  async getFilter(hash) {
    assert(hash);

    const filter = await this.blocks.readFilter(hash);
    if (!filter)
      return null;

    return Filter.fromRaw(filter);
  }

  /**
   * Retrieve compact filter header by hash.
   * @param {Hash} hash
   * @returns {Promise} - Returns {@link Hash}.
   */

  async getFilterHeader(hash) {
    assert(hash);

    return this.blocks.readHeader(hash);
  }
}

module.exports = FilterIndexer;
