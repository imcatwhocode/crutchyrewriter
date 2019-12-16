/* eslint no-new: 0 */
/* eslint prefer-arrow-callback: 0 */
/* eslint func-names: 0 */
/* global describe, it */
const assert = require('assert');
const CrutchyRewriter = require('..');

describe('Rules loading', function () {

  describe('Constructor', function () {

    it('should successfully loads from constructor argument', function () {

      const ruleset = [
        { match: '/boss', to: '/chairman/meow' },
        { match: '/', to: '/chairman/meow' },
        { match: (/^\/(test)\/[0-9]*$/), to: '/rewritten/location' },
        { match: test => (test.length === 32), to: '/32-charactered-url' },
      ];

      new CrutchyRewriter(ruleset);
      new CrutchyRewriter();
      new CrutchyRewriter([]);

    });

    it('should fail with incorrect ruleset passed to constructor', function () {

      assert.throws(() => new CrutchyRewriter('somestring'));
      assert.throws(() => new CrutchyRewriter(['str', 123]));
      assert.throws(() => new CrutchyRewriter([{ match: 1234, to: 'validlocation' }]));
      assert.throws(() => new CrutchyRewriter([{ match: '/1234', to: {} }]));
      assert.throws(() => new CrutchyRewriter([{ match: '', to: '/validloc' }]));
      assert.throws(() => new CrutchyRewriter([{ match: {}, to: '/1234' }]));
      assert.throws(() => new CrutchyRewriter([{}]));

    });

  });

  describe('#add', function () {

    it('should successfully loads valid rules', function () {

      const rr = new CrutchyRewriter();
      rr.add('/strict-match', '/other-location');
      rr.add((/^\/(test)\/[0-9]*$/), '/regexp-rewritten-location');
      rr.add(url => (url.length === 32), '/matching-fuction-rewritten-location');

    });

    it('should fails on invalid rules', function () {

      const rr = new CrutchyRewriter();
      assert.throws(() => rr.add());
      assert.throws(() => rr.add(1337, '/other-location'));
      assert.throws(() => rr.add('/regexp-rewritten-location'));
      assert.throws(() => rr.add(url => (url.length === 32), undefined));

    });

  });

});
