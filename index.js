// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js-selfbot-v13');
const { token } = require('./config.json');

//Markov
const markov = require('markovchain')

//Fs because files yay
const fs = require('fs');
const slurslist = new RegExp(fs.readFileSync("./1984.txt", "utf8"), "gi")

// Create a new client instance
const client = new Client({checkUpdate:false});

//Functions
//mkdir 😱
const mkdir = function(dir){
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
}
//Line counter (thanks stackoverflow)
const lc = function(file){
    let promise = new Promise(function(resolve, reject) {
        var i;
        var count = 0;
        require('fs').createReadStream(file)
        .on('data', function(chunk) {
            for (i=0; i < chunk.length; ++i)
            if (chunk[i] == 10) count++;
        })
        .on('end', function() {
            resolve(count)
        });
    })
    return promise
}
//Download & process message
const dlmsg = function(isserver, id, content){
    cleansedcontent = content.replace(slurslist, "")
    console.log(cleansedcontent)
    if(isserver){
        if(content != ""){
            mkdir("./bin/servers/" + id)
            fs.appendFileSync(`./bin/servers/${id}/msgbank.txt`, '\n'+ cleansedcontent.replace('\n', " "))
            lc(`./bin/servers/${id}/msgbank.txt`).then((response) =>{
                console.log(response)
            if(response>4999){
                fs.readFile(`./bin/servers/${id}/msgbank.txt`, 'utf8', function(err, data)
                {
                    var linesExceptFirst = data.split('\n').slice(1).join('\n');
                    fs.writeFileSync(`./bin/servers/${id}/msgbank.txt`, linesExceptFirst);
                });
            }
            })
        }
    }else{
        if(content != ""){
            mkdir("./bin/gcs/" + id)
            fs.appendFileSync(`./bin/gcs/${id}/msgbank.txt`, '\n'+ cleansedcontent.replace('\n', " "))
            lc(`./bin/gcs/${id}/msgbank.txt`).then((response) =>{
                console.log(response)
            if(response>999){
                fs.readFile(`./bin/gcs/${id}/msgbank.txt`, 'utf8', function(err, data)
                {
                    var linesExceptFirst = data.split('\n').slice(1).join('\n');
                    fs.writeFileSync(`./bin/gcs/${id}/msgbank.txt`, linesExceptFirst);
                });
            }
            })
        }
    }
}
//Markov chain text gen
const markovgen = function(isserver, id){
    let promise = new Promise(function(resolve, reject) {
        if(isserver){
            bank = fs.readFileSync(`./bin/servers/${id}/msgbank.txt`, 'utf8')
        }else{
            bank = fs.readFileSync(`./bin/gcs/${id}/msgbank.txt`, 'utf8')
        }
        quotes = new markov(bank)
        bankarr = bank.split('\n')
        bankarrfirst = []
        bankarr.forEach(element => {
            bankarrfirst.push(element.split(" ")[0])
        });
        result = quotes.start(bankarrfirst[Math.floor(Math.random()*bankarrfirst.length)]).end(100).process()
        console.log(result)
        resolve(result)
    })
    return promise
}
//Manage new messages
const newmsg = function(isserver, guildid, channelid, content){
    if(isserver){
        if(fs.existsSync(`./bin/servers/${guildid}/ognum.txt`)){ //Number of messages until doing something
            //Ummm do nothing (amazing)
        }else{
            fs.writeFileSync(`./bin/servers/${guildid}/ognum.txt`, JSON.stringify(Math.floor(Math.random() * 10) + 2))
        }
        if(fs.existsSync(`./bin/servers/${guildid}/curnum.txt`)){ //Current number of messages since doing something
            //Umm do nothing (amazing) (i am too lazy to ! the functions)
        }else{
            fs.writeFileSync(`./bin/servers/${guildid}/curnum.txt`, JSON.stringify(0))
        }

        ognum = fs.readFileSync(`./bin/servers/${guildid}/ognum.txt`)
        curnum = fs.readFileSync(`./bin/servers/${guildid}/curnum.txt`)
        if(curnum >= ognum){
            if(client.guilds.cache.get(guildid).members.cache.get(client.user.id).permissionsIn(channelid, "SEND_MESSAGES")){
                client.guilds.cache.get(guildid).channels.cache.get(channelid).sendTyping()
                markovgen(true, guildid).then((result)=>{
                    if(result==""||result==" "){
                        result="balls"
                    }
                    setTimeout(function() {
                    client.guilds.cache.get(guildid).channels.cache.get(channelid).send(result)
                    }, (result.length/((100*5)/60)) * 1000);
                })
                fs.unlinkSync(`./bin/servers/${guildid}/curnum.txt`)
                fs.unlinkSync(`./bin/servers/${guildid}/ognum.txt`)
            }
        }else{
            fs.writeFileSync(`./bin/servers/${guildid}/curnum.txt`, JSON.stringify(parseInt(curnum)+1))
        }
    }else{
        if(fs.existsSync(`./bin/gcs/${channelid}/ognum.txt`)){ //Number of messages until doing something
            //Ummm do nothing (amazing)
        }else{
            fs.writeFileSync(`./bin/gcs/${channelid}/ognum.txt`, JSON.stringify(Math.floor(Math.random() * 10) + 2))
        }
        if(fs.existsSync(`./bin/gcs/${channelid}/curnum.txt`)){ //Current number of messages since doing something
            //Umm do nothing (amazing) (i am too lazy to ! the functions)
        }else{
            fs.writeFileSync(`./bin/gcs/${channelid}/curnum.txt`, JSON.stringify(0))
        }

        ognum = fs.readFileSync(`./bin/gcs/${channelid}/ognum.txt`)
        curnum = fs.readFileSync(`./bin/gcs/${channelid}/curnum.txt`)
        if(curnum >= ognum){
                client.channels.cache.get(channelid).sendTyping()
                markovgen(false, channelid).then((result)=>{
                    if(result==""||result==" "){
                        result="balls"
                    }
                    setTimeout(function() {
                    client.channels.cache.get(channelid).send(result)
                    }, (result.length/((100*5)/60)) * 1000);
                })
                fs.unlinkSync(`./bin/gcs/${channelid}/curnum.txt`)
                fs.unlinkSync(`./bin/gcs/${channelid}/ognum.txt`)
        }else{
            fs.writeFileSync(`./bin/gcs/${channelid}/curnum.txt`, JSON.stringify(parseInt(curnum)+1))
        }
    }
}
// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
    console.log('Logged in as: ' + client.user.id)
    //console.log(slurslist)
    //markovgen(true, "1155331312014610512")
});

client.on('messageCreate', (msg) =>{
    //console.log(msg.content)
    if(msg.author.id != client.user.id){
            if(msg.guildId != null){
                console.log("Server")
                if(msg.author.id!="1058783679310209175" || msg.author.id != "825476927284445254"){ //I didnt like these guys (they spammed)
                    dlmsg(true, msg.guildId, msg.content)
                }
                if(msg.mentions.users.get(client.user.id) == undefined){
                    newmsg(true, msg.guildId, msg.channelId, msg.content)
                }else{
                    setTimeout(function() {
                        if(client.guilds.cache.get(msg.guildId).members.cache.get(client.user.id).permissionsIn(msg.channelId).has("SEND_MESSAGES")){
                            client.guilds.cache.get(msg.guildId).channels.cache.get(msg.channelId).sendTyping()
                            markovgen(true, msg.guildId).then((result) =>{
                                if(result==""||result==" "){
                                    result="balls"
                                }
                                setTimeout(function() {
                                    msg.reply({ content: result, allowedMentions: { repliedUser: false }})
                                    console.log("length: " + result.length)
                                    console.log("time took: " + (result.length/((100*5)/60)) * 1000)
                                }, (result.length/((100*5)/60)) * 1000); //(message.length/((wordsPerMinute*5)/60)) * 1000
                            })
                        }
                    }, Math.floor(Math.random() * 3000)+1000)
                }
            }else{
                console.log("Dms or gc")
                //console.log(msg.channel)
                if(msg.channel.type=="GROUP_DM"){
                    console.log("gc")
                    dlmsg(false, msg.channelId, msg.content)
                    if(msg.mentions.users.get(client.user.id) == undefined){
                        newmsg(false, null, msg.channelId, msg.content)
                    }else{
                        setTimeout(function() {
                            client.channels.cache.get(msg.channelId).sendTyping()
                            markovgen(false, msg.channelId).then((result) =>{
                                if(result==""||result==" "){
                                    result="balls"
                                }
                                setTimeout(function() {
                                    msg.reply(result)
                                    console.log("length: " + result.length)
                                    console.log("time took: " + (result.length/((100*5)/60)) * 1000)
                                }, (result.length/((100*5)/60)) * 1000); //(message.length/((wordsPerMinute*5)/60)) * 1000
                            })
                        }, Math.floor(Math.random() * 3000)+1000)
                    }
                }else{
                    console.log("dm")
                }
            }
    }
})

// Login to Discord with your client's token
client.login(token);