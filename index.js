'use strict';

const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();

app.use(compression());

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 86400000 }));

app.get('/', function(req, res, next) {
  res.sendFile('index.html', {
    root: __dirname + '/views/'
  });
});

const server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
