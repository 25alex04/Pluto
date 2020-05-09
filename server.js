const express = require("express");
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.engine("ejs", require("ejs").__express);
app.set("view engine", "ejs");

const DATABASE = "shop.db";
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(DATABASE);

const Bcrypt = require("bcrypt");

const session = require('express-session');
app.use(session({
    secret:'example',
    saveUninitialized: false,
    resave: false
}));


app.listen(3000, function(){
    console.log("listening on port 3000");
});

app.use(express.static(__dirname + '/public'));

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

app.get("/overview", function(req,res){
    res.sendFile(__dirname + "/views/overview.html")
})

app.get("/abmelden", function(req,res){
    req.session.destroy();
    res.sendFile(__dirname + "/views/welcome.html")
})

app.get("/nudeln", function(req,res){
    db.all(
        `SELECT * FROM produkte WHERE kategorie="nudeln"`,
        function(err,rows){
            res.render("produkte", {"produkte": rows, "kategorie": "Nudeln"});
        }
    )
})
app.get("/klopapier", function(req,res){
    db.all(
        `SELECT * FROM produkte WHERE kategorie="klopapier"`,
        function(err,rows){
            res.render("produkte", {"produkte": rows,"kategorie": "Klopapier"});
        }
    )
})
app.get("/desinfektionszeug", function(req,res){
    db.all(
        `SELECT * FROM produkte WHERE kategorie="desinfektion"`,
        function(err,rows){
            res.render("produkte", {"produkte": rows, "kategorie": "Desinfektionsmittel"});
        }
    )
})

app.get("/warenkorb", function(req,res){
    if(req.session.sessionValue != null){
        db.all(
            `SELECT * FROM warenkorb WHERE nutzer="${req.session.sessionValue[1]}"`,
            function(err,rows){
                res.render("warenkorb",{"warenkorb":rows})
            }
        )
    }else{
        res.sendFile(__dirname + "/views/signin.html")
    }
})

app.get("/kaufen",function(req,res){
    db.all(
        `SELECT * FROM warenkorb WHERE nutzer="${req.session.sessionValue[1]}"`,
        function(err,rows){
            res.render("kaufen",{"warenkorb":rows})
        }
    )
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

    

    db.all(
        `SELECT * FROM user`,
        function(err,rows){
            const users = rows;
            
            let u_name_exists = false;
            for(var i = 0; i<users.length;i++){
                if(u_name == users[i].username){
                    u_name_exists = true;
                    break
                }
            }
            if(u_name_exists==false){
                errors.push('Username existiert nicht')
            }

            for (var i = 0; i<users.length;i++){
                if(u_name == users[i].username){
                    if(Bcrypt.compareSync(pw,users[i].password)){
                        succes = true;
                        break;
                    }else{
                        errors.push('falsches Passwort');
                        break;
                    }
                }
            }
            
            if(succes){
                req.session.sessionValue = [Bcrypt.hashSync(u_name,10),u_name];
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
})

app.post("/signup", function(req,res){
    const vname = req.body.v_name;
    const nname = req.body.n_name;
    const nutzername = req.body.username;
    const e_mail = req.body.email;
    const pw1 = req.body.password_1;
    const pw2 = req.body.password_2;
    let errors = [];

    if(!vname){
        errors.push('Vorname fehlt');
    }
    if(!nname){
        errors.push('Nachname fehlt');
    }
    if(!nutzername){
        errors.push('Username fehlt');
    }
    if(!e_mail){
        errors.push('E-Mail fehlt');
    }
    if(!pw1){
        errors.push('Passwort fehlt');
    }
    if(!pw2){
        errors.push('Kein wiederholtes Passwort gegeben');
    }

    if(pw1!= pw2){
        errors.push('Die Passwörter stimmen nicht überein')
    }

    const hash = Bcrypt.hashSync(pw1,10);

    if(errors.length < 1){
        db.run(
            `INSERT INTO user(vorname,nachname,username,email,password) VALUES("${vname}","${nname}","${nutzername}","${e_mail}","${hash}")`,
            function(err){
                res.render("registriert", {prename: vname, surname: nname, user_n: nutzername})
            }
        )
    }else{
        let errdata ='Fehler beim Registrieren:<ul>';
        for(let e of errors){
            errdata += `<li>${ e }</li>`;
        }
        errdata += '</ul>'
        res.send(errdata + '<br><a href="/signup">Try again</a>')
    }
})

app.post("/details/:id", function(req,res){
    if(req.session.sessionValue != null) {  
        db.all(
            `SELECT * FROM produkte WHERE id=${req.params.id}`,
            function(err,rows){
                res.render("details", {"produkt": rows});
            }
        )
    }else{
        res.sendFile(__dirname + "/views/signin.html")
    }
})

app.post("/indenwarenkorb/:id", function(req,res){
    db.all(
        `SELECT * FROM produkte WHERE id=${req.params.id}`,
        function(err,rows){
            res.render("sure",{"pro":rows});
        }
    )
})

app.post("/unsicher/:id", function(req,res){
    db.all(
        `SELECT * FROM produkte WHERE id=${req.params.id}`,
        function(err,rows){
            res.render("details",{"produkt":rows});
        }
    )
})

app.post("/sicher/:id", function(req,res){
    db.all(
        `SELECT * FROM produkte WHERE id=${req.params.id}`,
        function(err,rows){
            const p_name = rows[0].name
            const p_preis = rows[0].preis
            const p_bild = rows[0].bild
            const p_nutzer= req.session.sessionValue[1]
            db.run(
                `INSERT INTO warenkorb(name,preis,bild,nutzer) VALUES("${p_name}",${p_preis},"${p_bild}", "${p_nutzer}")`,
                function(err){}
            )
            res.render("details",{"produkt":rows});
        },
    )    
})

app.post("/delete/:id",function(req,res){
    db.run(
        `DELETE FROM warenkorb WHERE id=${req.params.id}`,
        function(err){
            res.redirect("/warenkorb");
        }
    )
})

app.post("/buy",function(req,res){
    db.all(
        `SELECT * FROM warenkorb WHERE nutzer="${req.session.sessionValue[1]}"`,
        function(err,rows){
            if(rows.length !=0){
                res.render("kaufen",{"warenkorb":rows})
            }else{
                res.send('<p>Ihr Warenkorb ist leer</p><br><a href="/overview">Zur Übersicht</a>')
            }
        }
    )
})

app.post("/infos",function(req,res){
    const Ort = req.body.ort
    const PLZ = req.body.plz 
    const Straße = req.body.straße 
    const Hausnummer = req.body.hausnummer 
    const Zahlung = req.body.zahlung 
    let errors = []
    
    if(!Ort){
        errors.push('Ort nicht angegeben')
    }
    if(!PLZ){
        errors.push('Postleitzahl nicht angegeben')
    }
    if(!Straße){
        errors.push('Straße nicht angegeben')
    }
    if(!Hausnummer){
        errors.push('Hausnummer nicht angegeben')
    }
    if(!Zahlung){
        errors.push('Zahlungsmethode wurde nicht angegeben')
    }

    if(errors.length <1){
        db.all(
            `SELECT * FROM warenkorb WHERE nutzer="${req.session.sessionValue[1]}"`,
            function(err,rows){
                res.render("fast_fertig",{"warenkorb":rows, "Ort":Ort,"PLZ":PLZ,"Straße":Straße,"Hausnummer":Hausnummer,"Zahlung":Zahlung})
            }
        )        
    }else{
        let errdata ='Fehler bei der Kaufabwicklung:<ul>';
        for(let e of errors){
            errdata += `<li>${ e }</li>`;
        }
        errdata += '</ul>'
        res.send(errdata + '<br><a href="/kaufen">zurück</a>')
    }

})

app.post("/gekauft",function(req,res){
    res.sendFile(__dirname+"/views/sure2.html")
})

app.post("/kaufen",function(req,res){
    db.run(
        `DELETE FROM warenkorb WHERE nutzer="${req.session.sessionValue[1]}"`,
        function(err){
            res.sendFile(__dirname+"/views/erfolgreich.html")
        }
    )
})
app.post("/nicht_kaufen",function(req,res){
    res.redirect("/kaufen")
})