var memoize = require('./memoize')
  //, Store = require('ministore')('mdb')
  //, cache = Store('cache')

//cache.clear()

//memoize.set('store', cache)
memoize.set('debug', true)

var redis = memoize('myredis', require('redis').createClient(), { exclude: [ 'set' ] })

redis.set('foo', 'bar', function(err, res) {
  redis.get('foo', function(err, res) {
    redis.set('foo', 'baz', function(err, res) {
      redis.get('foo', function(err, res) {
        console.log(res) // still 'bar', hasn't expired yet!
      })
    })
  })
})