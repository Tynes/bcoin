/**
 * Filter tests for bcoin
 * Copyright (c) 2019, Braydon Fuller (MIT License).
 * Copyright (c) 2019, Javed Khan (MIT License).
 * Copyright (c) 2019, Mark Tyneway (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const assert = require('bsert');
const random = require('bcrypto/lib/random');
const Block = require('../lib/primitives/block');
const CoinView = require('../lib/coins/coinview');
const Script = require('../lib/script/script');
const Output = require('../lib/primitives/output');
const Outpoint = require('../lib/primitives/outpoint');
const Filter = require('../lib/golomb/filter');

const filterTests = require('../test/data/filter-valid.json');

describe('Filter', function() {
  for (const json of filterTests) {
    if (json.length === 1)
      continue;

    const height = json[0];

    it(`should match basic block filter for block ${height}`, async () => {
      const hash = json[1];
      const raw = json[2];

      const block = Block.fromRaw(raw, 'hex');
      assert.strictEqual(hash, block.rhash());

      const view = new CoinView();
      for (const raw of json[3]) {
        const hash = random.randomBytes(32);

        const output = new Output();
        output.script = Script.fromRaw(raw, 'hex');
        view.addOutput(new Outpoint(hash, 0), output);
      }

      const prev = Buffer.from(json[4], 'hex').reverse();

      const filter = Filter.fromOptions({
        block: block,
        view: view,
        prev: prev
      });

      assert.strictEqual(filter.toRaw().toString('hex'), json[5]);
      assert.strictEqual(filter.link.reverse().toString('hex'), json[6]);
    });
  }
});
