/* eslint prefer-arrow-callback: 0 */
/* eslint func-names: 0 */
/* global describe, it */
const assert = require('assert');
const http = require('http');
const http2 = require('http2');
const https = require('https');
const CrutchyRewriter = require('..');

// eslint-disable-next-line max-len
const MOCK_KEY = '-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIOKSjH8sEnALJjfyoR3cvUZpJNUf8SfhwHzyFHZ8mmJy\n-----END PRIVATE KEY-----';

// eslint-disable-next-line max-len
const MOCK_CERT = '-----BEGIN CERTIFICATE-----\nMIIC2TCCAougAwIBAgIUCARej+2tG4NWAp6nqp30UzhQ78cwBQYDK2VwMIHhMQsw\nCQYDVQQGEwJXVzESMBAGA1UECAwJV29ybGR3aWRlMRwwGgYDVQQHDBNTYWludC1C\ncm9va2x5bnNidXJnMSUwIwYDVQQKDBxBcmUgeW91IHJlYWxseSByZWFkaW5nIHRo\naXM/MUcwRQYDVQQLDD5JIGFzc3VtZSB0aGF0IHRoaXMgd29ybGQgaXMgZnVsbCBv\nZiBtdWNoIG1vcmUgaW1wb3J0YW50IHRoaW5nczESMBAGA1UEAwwJbG9jYWxob3N0\nMRwwGgYJKoZIhvcNAQkBFg1hcHBseUBjaWEuZ292MB4XDTE5MTIxNjAwMTM0MVoX\nDTQ3MDUwMzAwMTM0MVowgeExCzAJBgNVBAYTAldXMRIwEAYDVQQIDAlXb3JsZHdp\nZGUxHDAaBgNVBAcME1NhaW50LUJyb29rbHluc2J1cmcxJTAjBgNVBAoMHEFyZSB5\nb3UgcmVhbGx5IHJlYWRpbmcgdGhpcz8xRzBFBgNVBAsMPkkgYXNzdW1lIHRoYXQg\ndGhpcyB3b3JsZCBpcyBmdWxsIG9mIG11Y2ggbW9yZSBpbXBvcnRhbnQgdGhpbmdz\nMRIwEAYDVQQDDAlsb2NhbGhvc3QxHDAaBgkqhkiG9w0BCQEWDWFwcGx5QGNpYS5n\nb3YwKjAFBgMrZXADIQCKBXW1bvUywqTcnLt160vryHDOA/GQzi6PK8tljbxv9qNT\nMFEwHQYDVR0OBBYEFAzGpu/4cKzodQVjkGIFG93CVU2PMB8GA1UdIwQYMBaAFAzG\npu/4cKzodQVjkGIFG93CVU2PMA8GA1UdEwEB/wQFMAMBAf8wBQYDK2VwA0EAs4FN\nRxwfjvmOenz+p8YMwjEFpelNAS0keWwOUSJYZIjjH9ig8/7LIguhEyXRzXctIrG2\nwLe8Yj8l21F6DjWvDA==\n-----END CERTIFICATE-----';

describe('Fastify integration', function () {

  describe('#createInterceptHandler', function () {

    it('should correctly handle "handler" argument', function () {

      const rr = new CrutchyRewriter();
      rr.createInterceptHandler(() => {});
      assert.throws(() => rr.createInterceptHandler());
      assert.throws(() => rr.createInterceptHandler(1234));

    });

    it('should correctly handle location match', function (done) {

      const rr = new CrutchyRewriter();
      rr.add('/test-location', '/other-location');

      const interceptor = rr.createInterceptHandler(req => {

        assert.strictEqual(req.url, '/other-location');
        done();

      });

      interceptor({ url: '/test-location' });

    });

    it('should correctly handle location miss', function (done) {

      const rr = new CrutchyRewriter();
      rr.add('/test-location', '/other-location');
      rr.add('/', '/other-location');

      const interceptor = rr.createInterceptHandler(req => {

        assert.strictEqual(req.url, '/miss-location');
        done();

      });

      interceptor({ url: '/miss-location' });

    });

  });

  describe('#createServerFactory', function () {

    it('should return bounded server factory', function () {

      const rr = new CrutchyRewriter();
      assert(typeof rr.createServerFactory() === 'function');

    });

  });

  describe('#serverFactory', function () {

    it('should fail on incorrect arguments', function () {

      const rr = new CrutchyRewriter();
      assert.throws(() => rr.serverFactory());
      assert.throws(() => rr.serverFactory(() => {}, 1234));
      assert.throws(() => rr.serverFactory(1234, {}));

    });

    it('should return valid HTTP/2 + TLS server', function () {

      const rr = new CrutchyRewriter();
      const http2tls = rr.serverFactory(() => {}, { https: { key: MOCK_KEY, cert: MOCK_CERT }, http2: true });
      assert(http2tls instanceof http2.createSecureServer().constructor);

    });

    it('should return valid HTTP/2 server', function () {

      const rr = new CrutchyRewriter();
      const http2plain = rr.serverFactory(() => {}, { http2: true });
      assert(http2plain instanceof http2.createServer().constructor);

    });

    it('should return valid HTTP/1.1 + TLS server', function () {

      const rr = new CrutchyRewriter();
      const httpTls = rr.serverFactory(() => {}, { https: { key: MOCK_KEY, cert: MOCK_CERT } });
      assert(httpTls instanceof https.Server);

    });

    it('should return valid HTTP/1.1 server', function () {

      const httpPlain = (new CrutchyRewriter()).serverFactory(() => {}, {});
      const httpPlainWithoutOpts = (new CrutchyRewriter()).serverFactory(() => {});
      assert(httpPlain instanceof http.Server);
      assert(httpPlainWithoutOpts instanceof http.Server);

    });

  });

});
