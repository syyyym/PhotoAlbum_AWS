module.exports = function(express, app, formidable, fs, os, gm) {
    var Socket;  
    io.on('connection', function(socket){
        Socket = socket;
    })
    var singleImage = new mongoose.Schema({
        filename:String,
        votes:Number
    })
    var singleImageModel = mongoose.model('singleImage', singleImage);

    var router = express.Router();

    router.get('/', function(req, res, next){
        res.render('index',{host:app.get('host')});
    });
    router.post('/upload', function(req, res, next){    
        function generateFilename(filename){
            var ext_regex = /(?:\.([^.]+))?$/;
            var ext = ext_regex.exec(filename)[1];
            var date = new Date().getTime();
            var charBank = "abcdefghijklmnopqrstuvwxyz";
            var fstring = '';
            for(var i = 0; i < 15; i++){
                fstring += charBank[parseInt(Math.random()*26)];
            }
            return (fstring += date + '.' + ext);
        }
        
        var tmpFile, nfile, fname;
        var newForm = new formidable.IncomingForm();
        newForm.keepExtensions = true; 
        
		newForm.parse(req, function(err, fields, files){ 
			tmpFile = files.upload.path;
			fname = generateFilename(files.upload.name); 
			nfile = os.tmpDir() + '/' + fname; 
			res.writeHead(200, {'Content-type':'text/plain'}); 
			res.end(); 
        })
        newForm.on('end', function(){
            fs.rename(tmpFile, nfile, function(){
                // Resize the image and upload this file into the S3 bucket
				gm(nfile).resize(300).write(nfile, function(){ //callback function 
                    // Upload to the S3 Bucket                    
				})
            })
        })
    });
    app.use('/', router); 
}
