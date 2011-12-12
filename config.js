module.exports = {
    port : 8080,
    mongodb : 'mongodb://localhost/blog',
    avatarSize : 32,
    title : 'DangTian',
    description : '心园',
    hosturl : 'http://localhost:8080/',
    users:{
        admin:{
            name:'admin',
            salt:'hello world',
            pass:'newadmin'
        }
    }
}
