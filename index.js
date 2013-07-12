// most basic dependencies
var express = require('express')
var http = require('http')
var os = require('os')
var path = require('path')
var log = require('debug')('rabbitjs-test')

var amqp = require('amqp')

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


var deviceList = [
  '164731'
  , '775721'
  , '543789'
  , '818878'
  , '31816'
  , '736615'
  , '753544'
  , '387684'
  , '719218'
  , '543866'
  , '538031'
  , '68356'
  , '877515'
  , '261493'
  , '951305'
  , '350485'
  , '830250'
]


var connection =
  amqp.createConnection({url: "amqp://guest:guest@localhost:5672"})

// Wait for connection to become established.
connection.on('ready', function () {
  log('Connection', 'is open')

  var ex = connection.exchange('/queue/device', {}, function (exchange) {
    log('Exchange ' + exchange.name + ' is open')

    app.post('/queue/device/:id', function (req, res) {
      if (req.body.name) {
        ex.publish(req.params.id, JSON.stringify({id: req.params.id, name: req.body.name}), {contentEncoding: 'utf8', contentType: 'application/json'})
        res.send(200, 'thanks: ' + req.body.name)
      } else {
        res.send(400, 'Bad request, missing attributes.')
      }
    })
  })

  var q = connection.queue('/queue/1', function (queue) {
    log('Queue', queue.name, 'is open');
    //q.bind(ex, '818878')
    queue.bind(ex, '#')
    // Receive messages
    queue.subscribe(function (message) {
      // Print messages to stdout
      log('message');
      try {
        log('message - 1 - ', JSON.stringify(message));
      } catch (e) {
        log('error', e)
      }
    });
  })

  var q2;

  setInterval(function(){

    if(q2){
      q2.close()
    }

    var i = getRandomArbitrary(0, deviceList.length)

    var deviceId = deviceList[i];

    log('i', i)
    log('deviceId', deviceId)

    if (deviceId){

      q2 = connection.queue('/queue/' + deviceId, function (queue) {
        log('Queue', queue.name, 'is open');
        queue.bind(ex, deviceId)
        // Receive messages
        queue.subscribe(function (message) {
          // Print messages to stdout
          log('message');
          try {
            log('message', deviceId, JSON.stringify(message));
          } catch (e) {
            log('error', e)
          }
        });
      })

    }

  }, 10000)




})

http.createServer(app).listen(app.get('port'), function () {
  console.log("Express server listening on port " + app.get('port'));
})

// Returns a random number between min and max
function getRandomArbitrary(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

