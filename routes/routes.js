module.exports = function(express, app, formidable, fs, os, gm, s3, mongoose, io, config ) { 

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
        function getExtension(filename){
            var ext_regex = /(?:\.([^.]+))?$/; 
            return ext_regex.exec(filename)[1]; 
        }
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
			nfile = os.tmpdir() + '/' + fname; 
			res.writeHead(200, {'Content-type':'text/plain'}); 
			res.end(); 
        })
        newForm.on('end', function(){ 
            var ext = getExtension(fname);
            fs.rename(tmpFile, nfile, function(){ 
                // Resize the image and upload this file into the S3 bucket
				gm(nfile).resize(300).write(nfile, function(){
                    // Upload to the S3 Bucket
                    const uploadFile = () => {
					    fs.readFile(nfile, function(err, data){
                            if (err) throw err;
                            const params = {
                                Bucket: config.S3Bucket, 
                                Key: fname, 
                                Body: data,
                                ACL: 'public-read',
                                ContentEncoding: 'base64',
                                ContentType: 'image/'+ext
                                
                            };
                            s3.upload(params, function(s3Err, data) {
                                if (s3Err) throw s3Err
                                console.log(`File uploaded successfully at ${data.Location}`)                                
                                console.log('file has been successfully stored in the S3 bucket ');
                                var newImage = new singleImageModel({ 
                                    filename:fname,
                                    votes:0
                                }).save();
                                Socket.emit('status', {'msg':'Saved !!', 'delay':9000});
                                Socket.emit('doUpdate', {}); 
                                // Delete the Local File
                                fs.unlink(nfile, function(){
                                    console.log('Local File Deleted !');
                                })

                            });                            
                        })  
                    };                    
                    uploadFile();
				})             
            })
        })
    });
    app.use('/', router);
}
