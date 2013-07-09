// most basic dependencies
var express = require('express')
var http = require('http')
var os = require('os')
var path = require('path')
var rabbit = require('rabbit.js')
var log = require('debug')('rabbitjs-test')

// create the app
var app = express()

// configure everything, just basic setup
app.configure(function () {
  app.set('port', process.env.PORT || 3000)
  app.use(express.favicon())
  app.use(express.logger('dev'))
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(app.router)
})

// simple standard errorhandler
app.configure('development', function () {
  app.use(express.errorHandler())
})

var context = rabbit.createContext()

context.on('ready', function () {
  var pub = context.socket('PUB')

  pub.connect('/queue/stats')

  setInterval(function () {

    // publish to the stats topic
    pub.write(createMsg())

  }, 100);

  var pool = require('generic-pool').Pool({
    name: 'subscribers',
    create: function (callback) {
      var sub = context.socket('SUB')
      sub.connect('/queue/stats')
      callback(null, sub);
    },
    destroy: function (sub) {
      log('destroy')
      sub.destroy();
    },
    max: 50,
    // optional. if you set this, make sure to drain() (see step 3)
    min: 2,
    // specifies how long a resource can stay idle in pool before being removed
    idleTimeoutMillis: 30000,
    // if true, logs via console.log - can also be a function
    log: false
  })

  app.get('/queue/stats', function (req, res) {
    pool.acquire(function (err, sub) {

      if (err) {
        // handle error - this is generally the err from your
        // factory.create function
      }
      else {

        var listen = function(data, cb){
          res.write(data)
          res.end()
          pool.release(sub)
          cb()
        }

        function cleanup(){
          log('remove')
          sub.removeAllListeners('data')
        }

        sub.on('data', function(data){
          listen(data, cleanup)
        })
      }
    })

    req.on("close", function () {
      log('req', 'close')
    })

  })

  http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
  })

})


function createMsg() {
  return JSON.stringify({
    date: (new Date()).toISOString(), hostname: os.hostname(), type: os.type(), platform: os.platform(), uptime: os.uptime(), freemem: os.freemem(), totalmem: os.totalmem()
  })
}