#!/home/monitor/.nvm/versions/node/v10.7.0/bin/node

/* https://www.pingdom.com/resources/webhooks/ */

const fs = require('fs')
fs.writeFileSync('/run/monitor/monitor.webhook.pid',process.pid)

// --------------  REDIS -------------------------

var redis = require("redis")
var db = redis.createClient()

// --------------  WEB SERVER -------------------

var express = require('express')
var app = express()

var bp = require("body-parser")

app.get('/',function(req,res) {
  res.write('webhook server')
  res.end()
})
app.use(function(req,res,next) {
  console.log('webhook headers',req.headers)
  if(!req.headers) { return res.status(400).end(); }
  const ua = req.headers['user-agent']
  if(!ua || (ua.indexOf("pingdom")==-1)) { return res.status(400).end(); }
  console.log('webhook ip',req.connection.remoteAddress)
  next()
})
app.post('/webhook/pingdom',bp.json(),function(req,res,next) {
  var wh = req.body
  if(!wh) { return res.status(400).end(); }
  console.log('webhook body',wh)
  var whook = {
    id:wh.check_id,
    type:wh.check_type,
    changed:wh.state_changed_timestamp,
    was:wh.previous_state,
    now:wh.current_state,
    severity:wh.importance_level,
    comment:wh.long_description,
  }
  console.log('webhook',whook)
  db.publish('webhook',JSON.stringify(whook))
  res.write('this is done')
  res.end()
})

app.listen(3000,'0.0.0.0',function() {
  console.log('listening on 3000')
})
