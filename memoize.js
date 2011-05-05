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
}

var toSource = require('tosource')

// memoize
module.exports = exports = function() {
  var cache = {}

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
    }

  var target = opts.target
    , debug = opts.debug

  debug && console.log(opts)

  if (!target)
    throw new Error('No target object specified')

  function wrapper(method) {
    return function() {
      var args = [].slice.call(arguments)
        , cb = args.pop()
        
      // hash method name and arguments
      var hash = (method ? method + '%' : '') + toSource(args)

      // callback cache if we have it
      if ('undefined' !== typeof cache[hash]) {
        debug && console.log('in cache', hash)
        return cb.apply(this, cache[hash].args)
      }

      // or save it by wrapping the callback
      args.push(function(err) {
        // no caching if there's an error
        // unless error = false is used
        if (!opts.error || !err) {
          debug && console.log('caching', hash)
          cache[hash] = {
            args: [].slice.call(arguments)
          , timeout: opts.expire && setTimeout(function() {
              debug && console.log('expired', hash)
              delete cache[hash]
            }, opts.expire)
          }
        }
        cb.apply(this, arguments)
      })

      // is it an object method or a function
      method
        ? target[method].apply(target, args)
        : target.apply(target, args)
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
      .forEach(function(method) {
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
  memoized.__clearMemoizeCache__ = function() {
    for (var k in cache) {
      clearTimeout(cache[k].timeout)
    }
    cache = {}
  }
 
  return memoized
}

// clear cache of a memoized object
exports.clear = function(memoized) {
  memoized.__clearMemoizeCache__()
}

// set an option value
exports.set = function(k, v) {
  if ('object' === typeof k) {
    for (var key in k)
      options[key] = k[key]
  } else options[k] = v
}

// get an option value
exports.get = function(k) {
  return options[k]
}