/*
 *  Module dependencies
 * */

var PostController = require('../controllers/post');

module.exports = function(app){
    app.all('/post(/*)?',PostController.base);
    app.get('/',PostController.find);
    app.get('/rss',PostController.rss);
    app.get('/err',PostController.err);

    app.get('/page/:page',PostController.find);
    app.get('/tag/:tag',PostController.find);
    app.get('/word/:word',PostController.find);
    app.get('/post/:id/show',PostController.show);
    app.get('/post/add',PostController.restrict,PostController.add);
    app.post('/post/add',PostController.addPost);
    app.get('/post/:id/edit',PostController.restrict,PostController.edit);
    app.get('/post/:id/dele',PostController.restrict,PostController.dele);
    app.post('/post/:id/edit',PostController.editPost);
    app.post('/post/:id/addcomment',PostController.addComment);

    app.get('/login',PostController.login);
    app.post('/login',PostController.loginPost);
    app.get('/logout',PostController.logout);
}
