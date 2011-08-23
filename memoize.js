/*
 * memoize
 * by stagas
 *
 * MIT licenced
 */

// global options
var options = {
  target  : null
, expire  : 30000
, exclude : []
, only    : []
, error   : true
, debug   : false
, store   : null
}

var toSource = require('tosource')

// memoize
module.exports = exports = function memoize () {
  // copy global options
  var opts = {}
  for (var k in options) {
    opts[k] = options[k]
  }

  // parse options
  var arg, args = [].slice.call(arguments)
  while (arg = args.shift())
    if ('object' === typeof arg) {
      if (Array.isArray(arg)) opts.only = arg
      else if (opts.target == null) opts.target = arg
      else for (var k in arg) opts[k] = arg[k]
    } else if ('function' === typeof arg) {
      opts.target = arg
    } else if ('number' === typeof arg) {
      opts.expire = arg
    } else if ('string' === typeof arg) {
      opts.id = arg
    }

  var id = opts.id || Math.floor(Math.random() * 100000000).toString(36)
    , store = opts.store || new MemoryStore(opts.debug)
    , target = opts.target
    , debug = opts.debug

  debug && console.log(opts)

  if (!target)
    throw new Error('No target object specified')

  function wrapper (method) {
    return function () {
      var self = this
        , args = [].slice.call(arguments)
        , cb = args.pop()

      // memoize id, hash method name and arguments
      var hash = id + ('undefined' === typeof method ? '' : '.' + method) + '=' + toSource(args)

      // callback cache if we have it
      store.get(hash, function (err, cached) {
        debug && console.log('in cache', hash)
        if (!err && cached && (!cached.expires || cached.expires >= Date.now())) return cb.apply(self, cached.args)
        args.push(function (err) {
          var self = this
            , cbargs = [].slice.call(arguments)

          // no caching if there's an error
          // unless error = false is used
          if (!opts.error || !err) {
            debug && console.log('caching', hash)
            store.set(hash, {
              args: cbargs
            , expires: 'number' === typeof opts.expire
              ? Date.now() + opts.expire
              : false
            }, function (err) {
              if (err) throw err
              debug && console.log('cached', hash)
              cb.apply(self, cbargs)
            })
          } else cb.apply(self, cbargs)
        })

        // is it an object method or a function
        method
          ? target[method].apply(target, args)
          : target.apply(target, args)        
      })
    }
  }

  // memoized object
  var memoized

  // target is a function
  if ('function' === typeof target) {
    memoized = wrapper()
  } else { // target is an object
    memoized = {}
    Object.keys(target) // instance methods
      .concat(Object.keys(target.__proto__)) // prototype methods
      .forEach(function (method) {
      if ('function' !== typeof target[method]) return
      if (!opts.only.length && !opts.exclude.length
        || opts.only.length && ~opts.only.indexOf(method)
        || opts.exclude.length && !~opts.exclude.indexOf(method)
        ) {
        debug && console.log('adding method', method)
        memoized[method] = wrapper(method)
      } else memoized[method] = target[method].bind(target)
    })
  }

  // private clear cache method
  memoized.__clearMemoizeCache__ = function (cb) {
    store.clear(cb)
  }
 
  return memoized
}

// clear cache of a memoized object
exports.clear = function (memoized, cb) {
  memoized.__clearMemoizeCache__(cb)
}

// set an option value
exports.set = function (k, v) {
  if ('object' === typeof k) {
    for (var key in k)
      options[key] = k[key]
  } else options[k] = v
}

// get an option value
exports.get = function (k) {
  return options[k]
}

// MemoryStore
function MemoryStore () {
  this.data = {}
}

MemoryStore.prototype.get = function (key, cb) {
  cb(null, this.data[key])
}

MemoryStore.prototype.set = function (key, val, cb) {
  this.data[key] = val
  cb(null)
}

MemoryStore.prototype.clear = function (cb) {
  this.data = {}
  cb(null)
}