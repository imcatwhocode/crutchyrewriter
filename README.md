CrutchyRewriter
=======
CrutchyRewriter is a simple rewriting plugin for Fastify.
At this moment, it is deadly simple and even not support extracted parameters (like `/item/:id` to `/rewritten/item/:id`). I've created CrutchyRewriter for a single one single-page application I've done recently, but it can be useful for you too. 

For example, if you're using HTML5 History API in your reactive framework as well as the API sharing the same domain, you'll need to redirect all links like `/product/$id`, `/checkout`, `/blog/$id` to the index HTML page, but keeping routing `/api/` namespace as usual.

Here is how this case can be solved with the CrutchyRewriter:
```js
const Fastify = require('fastify');
const CrutchyRewriter = require('crutchyrewriter');

// Creating instance of CrutchyRewriter
const rewriter = new CrutchyRewriter([

  // You can pass default ruleset as constructor argument.
  // Here we're adding a RegExp match condition, which redirects
  // anything except /api/* to the public/index.html page
  match: /^\/(?!(api)).*$/, to: '/public/index.html'

]);

// It's important to pass CrutchyRewriter's customized serverFactory to Fastify
const fastify = Fastify({ serverFactory: rewriter.createServerFactory() });

// Serve static with fastify-static (just for example)
fastify.register(require('fastify-static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/public/',
})

// Perform your usual routine, define routes and etc
fastify.get('/api/meow', (req, reply) => reply.send({ cat: '(^・x・^)' }));
fastify.listen(3000);
```

## Rules
In CrutchyRewriter, "rules" are the literally rules — they define from where and to where we should redirect requests, so each rule consists of "match" and "to" properties. 

### Match
This property defines a condition that should match the URL to trigger rewriting. 

Currently, there are three types of conditions:
1. String — strictly matches URL (like `URL === condition`).
2. Regular expression — matches URL with `RegExp#test` function.
3. Function — passes URL as an argument to this function and expects boolean in return.

CrutchyRewriter supports neither priority nor default rules. Internal condition types priority is: strings first, then functions, then RegExps.  

String rules internally stored as a Map, so they can't have priorities, moreover, duplicating matching rule will overwrite already existing one. Function and RegExp rulesets act like FIFO-queues: first created rule is also first in the testing queue.

To summarize, the entire matching flow starts with strings. If nothing found, we begin iterating over function conditions starting from the first created rule. If nothing matched in functions as well, we begin iterating over regular expressions also from the first created rule. If nothing found among all condition types, request will be passed to the router as usual without any changes.

### To
This property defines a redirection target for matched requests. Nothing special, it just should be a string.

## API
Consists just of constructor and two methods — deadly simple, isn't it?

### CrutchyRewriter.constructor([ruleset])
Creates a new instance of CrutchyRewriter, the first argument allows you to pass a ruleset as `Array<Object>`.

```javascript
// No default ruleset
const rewriter = new CrutchyRewriter();

// Pass ruleset argument
const rewriter = new CrutchyRewriter([
  { match: /^\/(?!(api)).*$/, to: '/public/index.html' },
  { match: '/api/checkout', to: '/api/v1/customer/checkout` }
]);
```

### CrutchyRewriter#add(match, to)
Just adds a new rule. "Match" should be a String, Function, or RegExp. "To" is always a String.

```javascript
const rewriter = new CrutchyRewriter();

// Oops, we've forgot to add API versioning in our first gen API...
rewriter.add('/api/checkout', '/api/v2/checkout');

// Rewrite all non-API URLs to the index.html page
rewriter.add(/^\/(?!(api)).*$/, '/public/index.html');

// Rewrite only URLs with even length
rewriter.add(url => (url.length % 2 === 0), '/url/length/is/even');
```

### CrutchyRewriter#rewriter.createServerFactory()
Returns a custom serverFactory for Fastify init function.

```javascript
const Fastify = require('fastify');
const CrutchyRewriter = require('crunchyrewriter');

const rewriter = new CrutchyRewriter();
// ...

const fastify = new Fastify({ serverFactory: rewriter.createServerFactory() });
```
