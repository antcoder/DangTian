var Model = require('../models/post'),
    PostModel = Model.post,
    CommentModel = Model.comment,
    config = require('../config');

function hash(msg,key){
    return crypto.createHmac('sha256',key).update(msg).update(msg).disgest('hex');
}

function authenticate(name,pass,fn){
    var user = config.users[name];
    if(!user){
        return fn(new Error('not user'));
    }
    if(user.pass == pass){
        return fn(null,user);
    }
    new Error('password err');
}

module.exports = {
    base:function(req,res,next){
        //console.log('base');
        next();
    },
    restrict:function(req,res,next){
        if(req.session.user){
            next();
        }else{
            res.redirect('/login');
        }
    },
    login:function(req,res){
        if(req.session.user){
            res.redirect('/');
        }else{
            res.render('login');
        }
    },
    loginPost:function(req,res){
        var data = req.body.login;
        authenticate(data.username,data.password,function(err,user){
                if(user){
                    req.session.regenerate(function(){
                            req.session.user = user;
                            res.redirect('/');
                    });
                }else{
                    req.session.err = 'please check you password or username';
                    res.render('login');
                }
        });
    },
    logout:function(req,res){
        req.session.destroy(function(){
                res.redirect('/');
        });
    },
    find:function(req,res){ 
        if(req.isXMLHttpRequest){
            var page = req.params.page;
            where = req.session.where;
            PostModel.find(where).sort('date',-1).skip((page)*10).limit(10).run(function(err,results){
                    if(err){
                        console.log(err);
                    }else{
                        res.send(results); 
                    }
            });
        }else{
            var word ='/'+req.params.word+'/';
            var where = req.params.tag ? {tags:req.params.tag} : (req.params.word ? {$or:[{body:eval(word)},{title:eval(word)}]} : {});
            req.session.where = where;
            req.session.wheretxt = (req.params.tag ? 'Tags:'+req.params.tag : (req.params.word ? 'Word:'+req.params.word : 'All')) + ' ';
            PostModel.find(where).sort('date',-1).limit(10).run(function(err,results){
                    if(err){
                        console.log(err);
                    }else{
                        Model.db.collection('tagsSchema',function(err,collection){
                                if(err) console.log(err);
                                collection.find({}).sort({'value':-1}).toArray(function(err,tags){
                                        //console.log(tags);
                                        if(err) console.log(err);
                                        CommentModel.find({}).sort('date',-1).limit(10).run(function(err,rcomments){
                                                if(err) console.log(err);
                                                res.render('index',{title:'post index',rcomments:rcomments,posts:results,tags:tags,user:req.session.user});
                                                //console.log(results);
                                        });

                                });
                        });
                    }
            });
        }
        console.log('find');
    },
    show:function(req,res){
        PostModel.findById(req.params.id,function(err,post){
                CommentModel.where('_id').in(post.comments).sort('date',-1).run(function(err,comments){
                        //console.log(comments);
                        Model.db.collection('tagsSchema',function(err,collection){
                                collection.find({}).sort({'value':-1}).toArray(function(err,tags){
                                        //console.log(tags);
                                        CommentModel.find({}).sort('date',-1).limit(10).run(function(err,rcomments){
                                                res.render('post/show',{title:'post show',rcomments:rcomments,post:post,tags:tags,comment:{},comments:comments,user:req.session.user});
                                        });
                                });
                        });
                });
        });
        console.log('show');
    },
    add:function(req,res){
        res.render('post/form',{title:'post form',post:{},layout:false});
    },
    addPost:function(req,res){
        var data = req.body.post;
        var post = new PostModel();
        post.title = data.title;
        post.body = data.body;
        post.bodyhtml = data.bodyhtml;
        post.tags.length = 0;
        post.tags = data.tags.split(",");
        post.date = new Date();
        post.save(function(err){
                if(err){
                    console.log(err);
                }
                Model.tagreset();
                res.redirect('/');
        });
    },
    edit:function(req,res){
        PostModel.findById(req.params.id,function(err,post){
                if(err){
                    console.log(err);
                }
                res.render('post/form',{title:'post edit',post:post,layout:false});
        });
    },
    dele:function(req,res){
        PostModel.findById(req.params.id,function(err,post){
                CommentModel.remove({_id:{$in:post.comments}},function(err){
                        if(err) throw new err;
                        PostModel.remove({_id:req.params.id},function(err){
                                if(err) throw new err; 
                                res.redirect('/');
                        });
                });
        })
    },
    editPost:function(req,res){
        var data = req.body.post;
        PostModel.findById(req.params.id,function(err,post){
                post.title = data.title;
                post.body = data.body;
                post.bodyhtml = data.bodyhtml;
                post.tags.length = 0;
                post.tags = data.tags.split(",");
                post.date = new Date();
                post.save(function(err){
                        Model.tagreset();
                        res.redirect('/');
                });
        });
    },
    addComment:function(req,res){
        var data = req.body.comment;
        var comment = new CommentModel();
        comment.postid = req.params.id;
        comment.author = data.author;
        comment.website = data.website;
        comment.email = data.email;
        comment.body = data.body;
        comment.date = new Date();
        PostModel.findById(req.params.id,function(err,post){
                comment.save(function(err){
                        if(err){
                            req.session.err = err;
                            res.render('err');
                        }else{
                            post.comments.push(comment);
                            post.save(function(err){
                                    if(err) throw err;
                                    res.redirect('/');
                            });   
                        }
                });
        });
    },
    rss:function(req,res){
        var arr=['<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel>'];
        arr.push('<title>'+ config.title +'</title><description>'+ config.description
            +'</description><link>'+ config.hosturl +'</link>');

        PostModel.find({}).sort('date',-1).run(function(err,results){
                if(err){
                    console.log(err);
                }else{
                    results.forEach(function(item){
                            var rssitem = '<item><title><![CDATA['+item.title
                            +']]></title><link>'+ config.hosturl 
                            + '/post/' + item._id + '/show'
                            +'</link><description><![CDATA['+ item.bodyhtml.substring(0,100)
                            +']]></description></item>' 
                            arr.push(rssitem);
                    })
                    arr.push('</channel></rss>')
                    res.contentType('.xml');
                    res.send(arr.join(''));
                }
        });
    },
    err:function(req,res){
        res.render('err');
    }
}
