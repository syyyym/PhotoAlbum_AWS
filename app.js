var express = require('express'),
path = require('path'),
config = require('./config/config.js'),
fs = require('fs'), 
os = require('os'), 
formidable = require('formidable'),
gm = require('gm'),
mongoose = require('mongoose') 

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
app.use(express.static(path.join(__dirname, 'public')));
app.set('port', process.env.PORT || 3000);

require('./routes/routes.js')(express, app, formidable, fs, os, gm, mongoose, io);
var server = require('http').createServer(app);
var io = require('socket.io')(server); 
server.listen(app.get('port'), function(){
console.log('Photo Album running on port ' + app.get('port'));
});
