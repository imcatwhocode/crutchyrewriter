const http = require('http');
const http2 = require('http2');
const https = require('https');

/**
 * Rewrite condition object
 * @typedef {Object} RewriteCond
 * @property {String|RegExp|Function<Boolean>} match Matching rule
 * @property {String}                          to    Rewrite target
 */

/** Not really good rewriter for Fastify */
class CrutchyRewriter {

  /**
   * Creates a Rewriter instance
   * @param {Array<RewriteCond>} [rewrites] Rewrite rules
   */
  constructor(rewrites) {

    /**
     * Rewrite conditions
     * @type {Object}
     */
    this.conditions = {

      /**
       * Exact matching hashmap
       * @type {Map}
       */
      exact: new Map(),

      /**
       * Regexp store
       * @type {Array<RegExp>}
       */
      regexps: [],

      /**
       * Regexp values store
       * @type {Array<String>}
       */
      rgvalues: [],

      /**
       * Comparators store
       * @type {Array<Function<Boolean>>}
       */
      comparators: [],

      /**
       * Comparated values store
       * @type {Array<String>}
       */
      cpvalues: [],

    };

    // Check is rewrite conditions are passed
    if (typeof rewrites === 'undefined')
      return;

    // Check is rewrite conditions passed as array
    if (!Array.isArray(rewrites))
      throw new TypeError(`Rewrites conditions in constructor must be an Array, but ${typeof rewrites} given`);

    // Apply them
    rewrites.forEach(({ match, to }) => this.add(match, to));

  }

  /**
   * Apply new condition into rewrite conditions buffer
   * @param   {String|RegExp|Function<Boolean>}  match  Matching condition for rewrite
   * @param   {String}                           to     Rewrite target
   * @returns {Boolean}                                 Returns true, if succeed
   * @throws  {TypeError}                               Will throw an error if "match" or "to" incorrect
   */
  add(match, to) {

    if (typeof to !== 'string')
      throw new TypeError(`Rewriting "to" directive must be a string, but ${typeof to} given`);

    switch (typeof match) {

      // Regular expression
      case 'object':

        if (!(match instanceof RegExp))
          throw new TypeError('Given "match" criteria is an object, but is not a regular expression');

        this.conditions.regexps.push(match);
        this.conditions.rgvalues.push(to);
        return true;


      // Compare functions
      case 'function':
        this.conditions.comparators.push(match);
        this.conditions.cpvalues.push(to);
        return true;

      // Exact match
      case 'string':
        if (match.length === 0)
          throw new Error('Match condition string can\'t be empty');

        this.conditions.exact.set(match, to);
        return true;

      // Unknown stuff
      default:
        throw new TypeError(`Unsupported rewrite "from" condition given: ${typeof match}`);

    }

  }

  /**
   * Matches original URL with rewrite replacement
   * @param {String} url Original URL
   * @returns {String|null} Returns target URL if related rewrite condition exists, null otherwise
   */
  matchCondition(url) {

    if (typeof url !== 'string')
      throw new TypeError(`#matchCondition expects to receive URL as string, but ${typeof url} is given`);

    // Matching with exact rewrite conditions first
    const rewrite = this.conditions.exact.get(url);
    if (typeof rewrite === 'string')
      return rewrite;

    // Matching with comparators
    for (let idx = 0, len = this.conditions.comparators.length; idx < len; idx += 1)

      // Call each comparator until the first match
      if (this.conditions.comparators[idx](url))
        return this.conditions.cpvalues[idx];

    // Matching with regular expressions
    for (let idx = 0, len = this.conditions.regexps.length; idx < len; idx += 1)

      // Call each comparator until the first match
      if (this.conditions.regexps[idx].test(url))
        return this.conditions.rgvalues[idx];

    return null;

  }

  /**
   * Returns HTTP handler with injected rewriter
   * @param {Function<Object,Object>} handler Fastify default handler
   * @returns {Function<Object,Object>} Handler with rewriter proxy
   */
  createInterceptHandler(handler) {

    if (typeof handler !== 'function')
      throw new TypeError(`Intercept hadler must be a function, but ${typeof handler} given`);

    return (req, res) => {

      const rewrite = this.matchCondition(req.url);
      if (!rewrite) {
        handler(req, res);
        return;
      }

      req.url = rewrite;
      handler(req, res);

    };

  }

  /**
   * Returns our serverFactory binded to this class context
   * @returns {Object} Native HTTP server
   */
  createServerFactory() {

    return this.serverFactory.bind(this);

  }

  /**
   * Implementation of Fastify serverFactory interface
   * @param {Function<Object,Object>} handler Fastify HTTP handler
   * @param {Object}                  [opts]  Fastify options object
   * @returns {Object} Native HTTP server
   */
  serverFactory(handler, opts) {

    if (typeof handler !== 'function')
      throw new TypeError(`HTTP handler must be a function, but ${typeof handler} given`);

    if (typeof opts !== 'undefined' && typeof opts !== 'object')
      throw new TypeError(`Server factory "opts" argument must be an object or undefined, but ${typeof opts} given`);

    // HTTP/1.1 Plain
    if (typeof opts === 'undefined' || (!opts.http2 && !opts.https))
      return http.createServer(this.createInterceptHandler(handler));

    if (!opts.http2 && opts.https)
      return https.createServer(opts.https, this.createInterceptHandler(handler));

    // HTTP/2
    if (opts.https)
      return http2.createSecureServer(opts.https, this.createInterceptHandler(handler));
    return http2.createServer(this.createInterceptHandler(handler));

  }

}

module.exports = CrutchyRewriter;
