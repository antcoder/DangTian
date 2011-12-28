if(process.env.VCAP_SERVICES){
  var env = JSON.parse(process.env.VCAP_SERVICES);
  var mongo = env['mongodb-1.8'][0]['credentials'];
}
else{
  var mongo = {
    "hostname":"127.0.0.1",
    "username":"",
    "password":"", 
    "name":"",
    "db":"blog"
  }
}

var generate_mongo_url = function(obj){
  obj.hostname = (obj.hostname || 'localhost');
  obj.port = (obj.port || 27017);
  obj.db = (obj.db || 'test');

  if(obj.username && obj.password){
    return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port +"/" + obj.db;
  }
  else{
    return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
  }
}


module.exports = {
    mongodb : generate_mongo_url(mongo),
    port : (process.env.VMC_APP_PORT || 3000),
    host : (process.env.VCAP_APP_HOST || 'localhost'),
    avatarSize : 32,
    skin : 'red', //blue or red
    title : '早春龙井',
    description : '心园',
    hosturl : (process.env.VCAP_APP_HOST || 'localhost') + (process.env.VCAP_APP_PORT || 8000),
    users:{
        admin:{
            name:'admin',
            salt:'hello world',
            pass:'********'
        }
    }
}
