// most basic dependencies
var express = require('express')
var http = require('http')
var os = require('os')
var path = require('path')
var rabbit = require('rabbit.js')

// create the app
var app = express()

// configure everything, just basic setup
app.configure(function(){
  app.set('port', process.env.PORT || 3000)
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')
  app.use(express.favicon())
  app.use(express.logger('dev'))
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(app.router)
  app.use(express.static(path.join(__dirname, 'public')))
})

// simple standard errorhandler
app.configure('development', function(){
  app.use(express.errorHandler())
})

//---------------------------------------
// mini app
//---------------------------------------
var openConnections = []

var context = rabbit.createContext()

context.on('ready', function(){
  var pub = context.socket('PUB')

  pub.connect('/queue/stats')

  setInterval(function() {

    // publish to the stats topic
    pub.write(createMsg())

  }, 1000);

  app.get('/queue/stats', function(req, res){
    var sub = context.socket('SUB')
    sub.connect('/queue/stats')

    sub.on('data', function(data) {
      res.write(data)
      res.end()
      sub.destroy()
    })

  })

  http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  })

})


function createMsg() {
  return JSON.stringify({
    date: (new Date()).toISOString()
    , hostname: os.hostname()
    , type: os.type()
    , platform: os.platform()
    , uptime: os.uptime()
    , freemem: os.freemem()
    , totalmem: os.totalmem()
  })
}