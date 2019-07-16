var express = require('express'),
path = require('path'),
config = require('./config/config.js'),
fs = require('fs'), 
os = require('os'), 
formidable = require('formidable'),
gm = require('gm'),
mongoose = require('mongoose'),
AWS = require('aws-sdk')

mongoose.connect(config.dbURI, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', error => logger.log('Database connection error', error));
db.once('open', function () {
  console.log('Database connection successful')
});

var app = express();
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('hogan-express'));
app.set('view engine', 'html');
app.set('host', config.host);

//configure aws s3
var s3 = new AWS.S3({
    accessKeyId: config.S3AccessKey,
    secretAccessKey: config.S3Secret
});

app.use(express.static(path.join(__dirname, 'public')));
app.set('port', process.env.PORT || 3000);

require('./routes/routes.js')(express, app, formidable, fs, os, gm, s3, mongoose, io, config);
var server = require('http').createServer(app);
var io = require('socket.io')(server); 
server.listen(app.get('port'), function(){
console.log('Photo Album running on port ' + app.get('port'));
});
