var express = require('express');
var bodyParser= require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');
var app = express();
var JWT_SECRET = 'meowmeow';

var db=null;
MongoClient.connect("mongodb://localhost:27017/mittens",function(err,dbconn){
    if(!err){
        console.log("We are connected");
        db=dbconn;
    }
});

app.use(express.static('public'));
app.use(bodyParser.json());

app.get('/meows',function(req,res,next){
    db.collection('meows',function(err,meowsCollection){
        meowsCollection.find().toArray(function(err,meows){
            return res.json(meows);
        });
    });
});

app.post('/meows',function(req,res,next){
    
    var token = req.headers.authorization;
    var user = jwt.decode(token,JWT_SECRET);
    
    db.collection('meows',function(err,meowsCollection){
        var meowToInsert = {
            text:req.body.newMeow,
            user:user._id,
            username:user.username
        };
        meowsCollection.insert(meowToInsert,{w:1},function(err){
            return res.send();
        });
    });
    res.send();
});

app.put('/meows/remove',function(req,res,next){
    
    var token = req.headers.authorization;
    var user = jwt.decode(token,JWT_SECRET);
    
    db.collection('meows',function(err,meowsCollection){
        var meowId= req.body.meow._id;
        meowsCollection.remove({_id:ObjectId(meowId),user:user._id},{w:1},function(err){
            return res.send();
        });
    });
    res.send();
});

app.post('/users',function(req,res,next){
    
    db.collection('users',function(err,usersCollection){
        
    bcrypt.genSalt(10,function(err,salt){
        bcrypt.hash(req.body.password,salt,function(err,hash){
            var newUser = {
                username: req.body.username,
                password: hash
            };
            usersCollection.insert(newUser,{w:1},function(err){
                return res.send();
            });
        });
    });
        
    });
    res.send();
});

app.put('/users/signin',function(req,res,next){
    db.collection('users',function(err,usersCollection){
        usersCollection.findOne({username:req.body.username},function(err,user){
            bcrypt.compare(req.body.password,user.password,function(err,result){
                if(result){
                    var token = jwt.encode(user,JWT_SECRET);
                    return res.json({token:token});
                }else{
                    res.status(400).send();
                }
                res.send();
            });
        });   
    });
});

app.listen(3000,function(){
    console.log("Server lisng on port number 3000");
});