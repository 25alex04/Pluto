const express = require("express");
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.engine("ejs", require("ejs").__express);
app.set("view engine", "ejs");

const DATABASE = "shop.db";
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(DATABASE);

//registrierte Nutzer
let users = [
    {vorname: 'Max', nachname: 'Mustermann', username: 'MundM', email: 'max.mustermann@web.de', password: '123'}
]

app.listen(3000, function(){
    console.log("listening on port 3000");
});

//get-Anfragen an Server
app.get("/", function(req,res){
    res.sendFile(__dirname + "/views/welcome.html")
})

app.get("/signin", function(req,res){
    res.sendFile(__dirname + "/views/signin.html")
})

app.get("/signup", function(req,res){
    res.sendFile(__dirname + "/views/signup.html")
})

//Sign-in und Sign-up
app.post("/signin", function(req,res){
    const u_name = req.body.username;
    const pw = req.body.password;
    let succes = false;
    let errors =[];

    if(!u_name){
        errors.push('Username fehlt');
    }
    
    if(!pw){
        errors.push('Passwort fehlt')
    }

    let u_name_exists = false;
    for(let u of users){
        if(u_name == u.username){
            u_name_exists = true;
            break
        }
    }
    if(u_name_exists==false){
        errors.push('Username existiert nicht')
    }
    
    for (let u of users){
        if(u_name == u.username){
            if(pw == u.password){
                succes = true;
                break;
            }else{
                errors.push('falsches Passwort');
                break;
            }
        }
    }
    if(succes){
        res.render("succes", {name1: u_name});
    }else{
        let errdata = 'Fehler beim Anmelden.<ul>';
        for(let e of errors){
            errdata += `<li>${ e }</li>`;
        }
        errdata +='</ul>';
        res.send(errdata + '<br><a href="/signin">Try again</a>');
    }

})