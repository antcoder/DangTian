/*
*   models
*/
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

mongoose.connect(require("../config").mongodb,function(err){
    console.log(err);
});


function DateFormat(v){
    v = new Date(v);
    console.log(v);
    console.log(v.getFullYear()+':'+(v.getMonth()+1)+':'+v.getDate());
    return v.getFullYear()+':'+(v.getMonth()+1)+':'+v.getDate();
}

var commentsSchema = new Schema({
        id:ObjectId,
        postid:ObjectId,
        author:{type:String,required:true},
        avatar:{type:String},
        website:String,
        email:{type:String,required:true},
        body:String,
        date:Date
});

function md5(str){
    var hash = require('crypto').createHash('md5');
    return hash.update(str+"").digest('hex');
}

/*
* gravatar
*/
commentsSchema.pre('save',function(next){
        if(!this.avatar){
            var gravatarHost = 'http://www.gravatar.com/avatar/';
            this.avatar = gravatarHost + md5(this.email) + '.jpg?s='+require('../config.js').avatarSize
            +'&d=identicon&r=g';
        }
        next();
});

var postSchema = new Schema({
        id:ObjectId,
        author:String,
        title:{type:String,unique:true},
        body:String,
        bodyhtml:String,
        date:{type:Date},
        comments:[ObjectId],
        tags:[{type:String,index:true}]
});

var Post = module.exports.post = mongoose.model('postSchema',postSchema);
var Comment = module.exports.comment = mongoose.model('commentsSchema',commentsSchema);

/*
* tags reset
*/
module.exports.tagreset = function(){
    var map = function(){
        if(!this.tags){
            return;
        }
        this.tags.forEach(function(tag){
                emit(tag,1);
        });
    }

    var reduce = function(key,values){
        var count = 0;
        values.forEach(function(value){
                count += value;
        });
        return count;
    }
    Post.collection.mapReduce(map,reduce,{out:'tagsSchema'},function(err,val){
            if(err) throw err;
    });
    postSchema.index({tags:1});
}

module.exports.db = mongoose.connection.db;
