var memoize = require('./memoize')
  , should = require('should')

memoize.set('expire', 1000)
memoize.set('debug', true)

var date = memoize(function(cb) {
  setTimeout(function() {
    cb(Date.now())
  }, 100)
}, { error: false })

var obj = memoize({
  date: function(seed, cb) {
    setTimeout(function() {
      cb(null, Date.now())
    }, 100)
  }
})

var SomeClass = function() {
  this.date = function(seed, cb) {
    setTimeout(function() {
      cb(null, Date.now())
    }, 100)
  }
}
SomeClass.prototype.protoDate = function(seed, cb) {
  setTimeout(function() {
    cb(null, Date.now())
  }, 100)
}
someClass = memoize(new SomeClass)

date(function(d1) {
  date(function(d2) {
    d1.should.equal(d2)
  })
})

obj.should.have.property('date')
obj.date(1, function(err, d1) {
  obj.date(1, function(err, d2) {
    d1.should.equal(d2)
    obj.date(2, function(err, d3) {
      d1.should.not.equal(d3)
    })
  })
  setTimeout(function() {
    obj.date(1, function(err, d4) {
      d1.should.equal(d4)
    })
  }, 800)
  setTimeout(function() {
    obj.date(1, function(err, d5) {
      d1.should.not.equal(d5)
    })
  }, 1200)
})

obj.date({ foo: 1, fn: function() { return 1 } }, function(err, d1) {
  obj.date({ foo: 1, fn: function() { return 1 } }, function(err, d2) {
    d1.should.equal(d2)
    obj.date({ foo: 2, fn: function() { return 1 } }, function(err, d3) {
      d1.should.not.equal(d3)
      obj.date({ foo: 1, fn: function() { return 2 } }, function(err, d4) {
        d1.should.not.equal(d4)
      })
    })
  })
})

someClass.should.have.property('date')
someClass.should.have.property('protoDate')
someClass.date(1, function(err, d1) {
  someClass.date(1, function(err, d2) {
    d1.should.equal(d2)
    someClass.date(2, function(err, d3) {
      d1.should.not.equal(d3)
    })
  })
})

someClass.protoDate(1, function(err, d1) {
  someClass.protoDate(1, function(err, d2) {
    d1.should.equal(d2)
    someClass.protoDate(2, function(err, d3) {
      d1.should.not.equal(d3)
    })
  })
})