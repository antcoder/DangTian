/*
 *  Module dependencies
 * */
var config = require('./config');

var express = require('express'),
    csrf = require('express-csrf'),
    app = module.exports = express.createServer(),
    stylus = require('stylus'),
    nib = require('nib');
    cluster = require('cluster'),
    mongoStore = require('connect-mongo');

function compile(str, path) {
    return stylus(str)
    .set('filename', path)
    .set('compress', true)
    .use(nib());
}

//Config
app.configure(function(){
        app.set('views',__dirname + '/views');
        app.set('view engine','jade');
        app.use(express.bodyParser());
        app.use(express.cookieParser());
        app.use(express.session({secret:'pig'}));
        app.use(express.methodOverride());
        app.use(stylus.middleware({
                    src:__dirname+'/public',
                    compile:compile
        }));
        app.use(app.router);
        var oneYear = 31557600000;
        app.use(express.static(__dirname+'/public',{ maxAge: oneYear }));
        app.use(express.staticCache());
        app.error(function(err,req,res){
                if(err) res.render('500');
        });
        app.use(function(req,res){
            res.render('404');
        });

});

app.dynamicHelpers({
        message:function(req){
            if(req.session.err) return req.session.err;
        },
        csrf:csrf.token,
        wheretxt:function(req){
            if(req.session.wheretxt) return req.session.wheretxt;
        }
});

app.configure('development',function(){
        app.use(express.errorHandler({dumpExceptions:true, showStack: true}));
});

app.configure('production',function(){
        app.use(express.errorHandler());
});

//Routes
require('./routes/post')(app);

var numCPUs = require('os').cpus().length;
if(cluster.isMaster){
    for(var i=0;i<numCPUs;i++){
        cluster.fork();
    }

    cluster.on('death',function(worker){
            console.log('worker'+worker.id+' is death');
            cluster.fork();
    });
}else{
    app.listen(config.port);
    console.log('Blog started on port ' + config.port);
}

/*
if(!module.parent){
    app.listen(config.port);
    console.log('Blog started on port ' + config.port);
}
*/
