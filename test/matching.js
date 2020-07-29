/* eslint no-new: 0 */
/* eslint prefer-arrow-callback: 0 */
/* eslint func-names: 0 */
/* global describe, it */
const assert = require('assert');
const CrutchyRewriter = require('..');

describe('Condition matching', function () {

  it('should handle invalid values correctly', function () {

    const rr = new CrutchyRewriter();
    assert.strictEqual(rr.matchCondition(''), null);
    assert.throws(() => rr.matchCondition(null));
    assert.throws(() => rr.matchCondition(undefined));

  });

  it('should perform exact matching correctly', function () {

    const rr = new CrutchyRewriter();
    rr.add('/', '/rewrite-test');
    rr.add('/chairman/meow', '/boss');

    assert.strictEqual(rr.matchCondition('/'), '/rewrite-test');
    assert.strictEqual(rr.matchCondition('/chairman/meow'), '/boss');

  });

  it('should perform regexp matching correctly', function () {

    const rr = new CrutchyRewriter();
    rr.add(/^\/(test)$/, '/rewrite-test');
    rr.add(/^\/(item)\/[0-9]*$/, '/rewrite-item');

    assert.strictEqual(rr.matchCondition('/test'), '/rewrite-test');
    assert.strictEqual(rr.matchCondition('/item/238'), '/rewrite-item');

  });

  it('should work correctly with matching functions', function () {

    const rr = new CrutchyRewriter();
    rr.add(url => (url.indexOf('needle') > -1), '/rewrite-target');
    assert.strictEqual(rr.matchCondition('/hay/stack/needle/weedle'), '/rewrite-target');
    assert.strictEqual(rr.matchCondition('/hay/stack/non33dl3shere/weedle'), null);

  });

});
