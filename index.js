const { Scenes, session, Telegraf, Markup } = require ("telegraf");
require('dotenv').config();
const { enter, leave } = Scenes.Stage;

// SCENE STARTGAME

const startGame = new Scenes.BaseScene("startGame");

startGame.enter(async ctx => {
    try {
        let chat = await collection.findOne({chat_id: ctx.chat.id});
        if(chat == null) {
            let chtop = await collection.findOne({_id: ObjectId('636e7752c7ac7456a91fb889')});
            let chres = await chtop.rooms + 1
            await collection.findOneAndUpdate({_id: ObjectId('636e7752c7ac7456a91fb889')}, {$set: {rooms: chres}});
            let roomc = await collection.findOne({_id: ObjectId('636e7752c7ac7456a91fb889')})
            await collection.insertOne(
                {
                    room: roomc.rooms,
                    players: [],
                    chat_id: ctx.chat.id,
                    fcl: 'no',
                    scl: 'no',
                    hq: 0,
                    tofmi: 0,
                    sofmi: 0,
                    startgameend: 'no',
                    totbank: 0,
                    round: 0
                }
            ) 
            let tstart = await ctx.replyWithPhoto({source: './Preview.jpg'}, {
                ...Markup.inlineKeyboard(
                    [
                        [Markup.button.url('🔁 Присоединиться', `https://t.me/cheatandtake_bot?start=${ctx.chat.id}`)]
                    ]
                ), caption: `Ожидание игроков...`
            })
            await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {tst: tstart.message_id}});
            await setTimeout(async () => {
                let tmwarn = await collection.findOne({chat_id: ctx.chat.id});
                if(tmwarn == null) {
                    return
                }else {
                    if(tmwarn.startgameend == 'no') {
                        await ctx.reply('🛑 Осталось 30 сек. до окончания набора:', {reply_to_message_id: tmwarn.tst})
                        await setTimeout(async () => {
                            let tmwarnend = await collection.findOne({chat_id: ctx.chat.id});
                            if (tmwarnend == null) {
                                return
                            }else {
                                if(tmwarnend.startgameend == 'no') {
                                    await ctx.reply('🛑 Набор в игру завершен. Игра окончена!')
                                    let roomscont = await collection.findOne({_id: ObjectId('636e7752c7ac7456a91fb889')})
                                    let res = await roomscont.rooms - 1;
                                    await ctx.tg.deleteMessage(tmwarnend.chat_id, tmwarnend.tst)
                                    await collection.findOneAndUpdate({_id: ObjectId('636e7752c7ac7456a91fb889')}, {$set: {rooms: res}})
                                    await collection.findOneAndDelete({chat_id: tmwarnend.chat_id})
                                }else {  
                                    return
                                }
                            }
                        }, 30000)
                    }else {
                        return
                    }
                }
                
            }, 60000) 
        }else {
            await ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id)  
        }
    }catch(e) {
        console.error(e);
    }
})

// SCENE GAME

const game = new Scenes.BaseScene("game");

function getRandomArbitrary(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let cards = ['./M.png', './X.png']

game.enter(async (ctx) => {
    try {
        let findch = await collection.findOne({chat_id: ctx.chat.id});
        await ctx.tg.deleteMessage(findch.chat_id, findch.tst)

        if (findch.totbank == 100) {
            await ctx.tg.sendPhoto(findch.chat_id, {source: './100K.png'}, {parse_mode: "HTML", caption: `<a href="tg://user?id=${findch.players[0].user_id}">${findch.players[0].name}</a> 👤 VS 👤 <a href="tg://user?id=${findch.players[1].user_id}">${findch.players[1].name}</a>`});
            await ctx.scene.enter("tofp");            
        }else if(findch.totbank == 300) {
            await ctx.tg.sendPhoto(findch.chat_id, {source: './300K.png'}, {parse_mode: "HTML", caption: `<a href="tg://user?id=${findch.players[0].user_id}">${findch.players[0].name}</a> 👤 VS 👤 <a href="tg://user?id=${findch.players[1].user_id}">${findch.players[1].name}</a>`});
            await ctx.scene.enter("tofp"); 
        }else {
            await ctx.tg.sendPhoto(findch.chat_id, {source: './500K.png'}, {parse_mode: "HTML", caption: `<a href="tg://user?id=${findch.players[0].user_id}">${findch.players[0].name}</a> 👤 VS 👤 <a href="tg://user?id=${findch.players[1].user_id}">${findch.players[1].name}</a>`});
            await ctx.scene.enter("tofp");
        }
    }catch(e) {
        console.error(e);
    }
})

const tofp = new Scenes.BaseScene("tofp");

tofp.enter(async (ctx) => {  
    try {
        let findch = await collection.findOne({chat_id: ctx.chat.id});
        let random = await getRandomArbitrary(0, 1);
        let whoview = await getRandomArbitrary(0, 1);
        let cardsnum = findch.round + 1;
        await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {round: cardsnum}})
        if(random == 1) {
            await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {fpr: './M.png'}})
            await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {spr: './X.png'}})
        }else {  
            await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {fpr: './X.png'}})
            await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {spr: './M.png'}})
        }  
      
        let findcar = await collection.findOne({chat_id: findch.chat_id});
    
        if(whoview == 0) {
            await ctx.tg.sendPhoto(findcar.players[0].perschat, {source: findcar.fpr}, {caption: `Вам дали посмотреть вашу карту. ${findcar.round} - раунд`});
            await ctx.tg.sendMessage(findcar.chat_id, `👤 Игроку <a href="tg://user?id=${findcar.players[0].user_id}">${findcar.players[0].name}</a> дали возможность посмотреть на свою карту...`, {parse_mode: "HTML"})
            await ctx.tg.sendPhoto(findcar.players[1].perschat, {source: './q.png'}, {caption: `Вам неизвестно какая у вас карта. ${findcar.round} - раунд`});
            await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {forfirst: false}})
            await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {forsecond: true}})
        }else {
            await ctx.tg.sendPhoto(findcar.players[0].perschat, {source: './q.png'}, {caption: `Вам неизвестно какая у вас карта. ${findcar.round} - раунд`});
            await ctx.tg.sendPhoto(findcar.players[1].perschat, {source: findcar.spr}, {caption: `Вам дали посмотреть вашу карту. ${findcar.round} - раунд`});
            await ctx.tg.sendMessage(findcar.chat_id, `👤 Игроку <a href="tg://user?id=${findcar.players[1].user_id}">${findcar.players[1].name}</a> дали возможность посмотреть на свою карту...`, {parse_mode: "HTML"})
            await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {forfirst: true}})
            await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {forsecond: false}})
        }
        await ctx.scene.enter("speak")
    }catch(e) {
        console.error(e);
    }
})

const topfcon = new Scenes.BaseScene("topfcon");

topfcon.enter(async (ctx) => {  
    try {
        let findch = await collection.findOne({players: {user_name: ctx.callbackQuery.from.username, user_id: ctx.callbackQuery.from.id, perschat: ctx.chat.id, name: ctx.callbackQuery.from.first_name}});
        await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {fcl: 'no'}})
        await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {scl: 'no'}})
        await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {hq: 0}})
        if (findch.frstsbank ==  0 || findch.secondsbank  ==  0 ) {
            await ctx.scene.enter('leaves')
        }else{
            let random = await getRandomArbitrary(0, 1);
            let whoview = await getRandomArbitrary(0, 1);
            let roundscount = findch.round + 1;
            await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {round: roundscount}})
            if(random == 1) {
                await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {fpr: './M.png'}})
                await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {spr: './X.png'}})
            }else {  
                await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {fpr: './X.png'}})
                await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {spr: './M.png'}})
            }  
          
            let findcar = await collection.findOne({chat_id: findch.chat_id});
        
            if(whoview == 0) {
                await ctx.tg.sendPhoto(findcar.players[0].perschat, {source: findcar.fpr}, {caption: `Вам дали посмотреть вашу карту. ${findcar.round} - раунд`});
                await ctx.tg.sendMessage(findcar.chat_id, `👤 Игроку <a href="tg://user?id=${findcar.players[0].user_id}">${findcar.players[0].name}</a> дали возможность посмотреть на свою карту...`, {parse_mode: "HTML"})
                await ctx.tg.sendPhoto(findcar.players[1].perschat, {source: './q.png'}, {caption: `Вам неизвестно какая у вас карта. ${findcar.round} - раунд`});
                await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {forfirst: false}})
                await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {forsecond: true}})
            }else {
                await ctx.tg.sendPhoto(findcar.players[0].perschat, {source: './q.png'}, {caption: `Вам неизвестно какая у вас карта. ${findcar.round} - раунд`});
                await ctx.tg.sendPhoto(findcar.players[1].perschat, {source: findcar.spr}, {caption: `Вам дали посмотреть вашу карту. ${findcar.round} - раунд`});
                await ctx.tg.sendMessage(findcar.chat_id, `👤 Игроку <a href="tg://user?id=${findcar.players[1].user_id}">${findcar.players[1].name}</a> дали возможность посмотреть на свою карту...`, {parse_mode: "HTML"})
                await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {forfirst: true}})
                await collection.findOneAndUpdate({chat_id: findch.chat_id}, {$set: {forsecond: false}})
            }
            await ctx.scene.enter("speakkon")            
        }
    }catch(e) {
        console.error(e);
    }
})


// SCENE SPEAK

const speak = new Scenes.BaseScene("speak");

speak.enter(async (ctx) => {
    try {
        let fromgame = await collection.findOne({chat_id: ctx.chat.id})
        await ctx.tg.sendMessage(fromgame.chat_id, `💭 Игра началась. Раунд - ${fromgame.round}.\nВы можете переговориться о будущем обмене карт или оставить всё как прежде. Удачи!\n\nЕсли вы уже готовы принять решение то введите команду /skip`)
    }catch(e) {
        console.error(e);
    }
})



const speakkon = new Scenes.BaseScene("speakkon");

speakkon.enter(async (ctx) => {
    try {
        let fromgame = await collection.findOne({players: {user_name: ctx.callbackQuery.from.username, user_id: ctx.callbackQuery.from.id, perschat: ctx.chat.id, name: ctx.callbackQuery.from.first_name}})
        await ctx.tg.sendMessage(fromgame.chat_id, `💭 Игра продолжается. Раунд - ${fromgame.round}\nЕсли вы уже готовы принять решение то введите команду /skip`)
    }catch(e) {
        console.error(e);
    }
})

// SCENE QUIZ

const quiz = new Scenes.BaseScene("quiz");

quiz.enter(async (ctx) => {
    try {
        let findch = await collection.findOne({chat_id: ctx.chat.id});
        if(findch.forfirst == true) {
            let tofu = await ctx.telegram.sendMessage(findch.players[0].perschat, 'Хочешь поменять карты?', {
                ...Markup.inlineKeyboard(  
                    [
                        [Markup.button.callback('Да, меняй', 'ye'), Markup.button.callback('Нет, оставим', 'non')]
                    ]
                ).resize().oneTime()
            });
            await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {tofmi: tofu.message_id}});
            await ctx.replyWithHTML(`<a href="tg://user?id=${findch.players[0].user_id}">${findch.players[0].name}</a>, пришло время действовать...\n\nПерейдите в лс <a href="https://t.me/cheatandtake_bot">боту</a> и примите решение...\nВсе зависит только от вас!`, {disable_web_page_preview: true});
        }else if(findch.forsecond == true) {
            let tosu = await ctx.telegram.sendMessage(findch.players[1].perschat, 'Хочешь поменять карты?', {
                ...Markup.inlineKeyboard(
                    [
                        [Markup.button.callback('Да, меняй', 'ye'), Markup.button.callback('Нет, оставим', 'non')]
                    ]
                ).resize().oneTime()
            });
            await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {sofmi: tosu.message_id}});
            await ctx.replyWithHTML(`<a href="tg://user?id=${findch.players[1].user_id}">${findch.players[1].name}</a>, пришло время действовать...\n\nПерейдите в лс <a href="https://t.me/cheatandtake_bot">боту</a> и примите решение...\nВсе зависит только от вас!`, {disable_web_page_preview: true});
        }else {
            return
        }
    }catch(e) {
        console.error(e);
    } 
})

// SCENE RESULT

const results = new Scenes.BaseScene("results");

results.enter(async ctx => {
    try {
        let cht = await collection.findOne({firschatid: ctx.chat.id});
        let chts = await collection.findOne({secondchatid: ctx.chat.id});    
        if(cht != null) {
            await ctx.tg.sendMessage(cht.chat_id, 'Пришло время показать карты обеих участников...');
            let card = await collection.findOne({firschatid: cht.firschatid})
            setTimeout(async () => {
                await ctx.tg.sendPhoto(card.chat_id, {source: card.spr}, {parse_mode: "HTML", caption: `🃏 Карта первого участника - <a href="tg://user?id=${card.players[0].user_id}">${card.players[0].name}</a>`})
                await ctx.tg.sendPhoto(card.chat_id, {source: card.fpr}, {parse_mode: "HTML", caption: `🃏 Карта первого участника - <a href="tg://user?id=${card.players[1].user_id}">${card.players[1].name}</a>`})
                await collection.findOneAndUpdate({firschatid: ctx.chat.id}, {$set: {fpr: card.spr}})
                await collection.findOneAndUpdate({firschatid: ctx.chat.id}, {$set: {spr: card.fpr}})
                let card_sectime = await collection.findOne({firschatid: ctx.chat.id})
                if(card_sectime.fpr == './M.png') {
                    await ctx.tg.sendMessage(card.chat_id, `🥇 Победитель:\n<a href="tg://user?id=${card.players[0].user_id}">${card.players[0].name}</a>`, {parse_mode: "HTML"})
                    if (card_sectime.totbank == 100) {
                        let minmony = card_sectime.secondsbank - 20;
                        await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {secondsbank: minmony}})
                        let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                        await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К`, {parse_mode: "HTML"})

                        await ctx.scene.enter('topfcon')
                    }else if (card_sectime.totbank == 300) {
                        let minmony = card_sectime.secondsbank - 60;
                        await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {secondsbank: minmony}})
                        let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                        await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К`, {parse_mode: "HTML"})

                        await ctx.scene.enter('topfcon')
                    }else {
                        let minmony = card_sectime.secondsbank - 100;
                        await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {secondsbank: minmony}})
                        let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                        await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К`, {parse_mode: "HTML"})

                        await ctx.scene.enter('topfcon')
                    }
                }else {
                    await ctx.tg.sendMessage(card.chat_id, `🥇 Победитель:\n<a href="tg://user?id=${card.players[1].user_id}">${card.players[1].name}</a>`, {parse_mode: "HTML"})
                    if (card_sectime.totbank == 100) {
                        let minmony = card_sectime.frstsbank - 20;
                        await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {frstsbank: minmony}})
                        let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                        await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К`, {parse_mode: "HTML"})

                        await ctx.scene.enter('topfcon')
                    }else if (card_sectime.totbank == 300) {
                        let minmony = card_sectime.frstsbank - 60;
                        await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {frstsbank: minmony}})
                        let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                        await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К`, {parse_mode: "HTML"})

                        await ctx.scene.enter('topfcon')
                    }else {
                        let minmony = card_sectime.frstsbank - 100;
                        await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {frstsbank: minmony}})
                        let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                        await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К`, {parse_mode: "HTML"})

                        await ctx.scene.enter('topfcon')
                    }
                }
            }, 3000)
        }else if(chts != null) {
            await ctx.tg.sendMessage(chts.chat_id, 'Пришло время показать карты обеих участников...');
            let card = await collection.findOne({secondchatid: chts.secondchatid})
            setTimeout(async () => {
                await ctx.tg.sendPhoto(card.chat_id, {source: card.spr}, {parse_mode: "HTML", caption: `🃏 Карта первого участника - <a href="tg://user?id=${card.players[0].user_id}">${card.players[0].name}</a>`})
                await ctx.tg.sendPhoto(card.chat_id, {source: card.fpr}, {parse_mode: "HTML", caption: `🃏 Карта первого участника - <a href="tg://user?id=${card.players[1].user_id}">${card.players[1].name}</a>`})
                await collection.findOneAndUpdate({secondchatid: ctx.chat.id}, {$set: {fpr: card.spr}})
                await collection.findOneAndUpdate({secondchatid: ctx.chat.id}, {$set: {spr: card.fpr}})
                let card_sectime = await collection.findOne({secondchatid: ctx.chat.id})
                if(card_sectime.fpr == './M.png') {
                    await ctx.tg.sendMessage(card.chat_id, `🥇 Победитель:\n<a href="tg://user?id=${card.players[0].user_id}">${card.players[0].name}</a>`, {parse_mode: "HTML"})
                    if (card_sectime.totbank == 100) {
                        let minmony = card_sectime.secondsbank - 20;
                        await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {secondsbank: minmony}})
                        let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                        await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К`, {parse_mode: "HTML"})

                        await ctx.scene.enter('topfcon')
                    }else if (card_sectime.totbank == 300) {
                        let minmony = card_sectime.secondsbank - 60;
                        await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {secondsbank: minmony}})
                        let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                        await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К`, {parse_mode: "HTML"})

                        await ctx.scene.enter('topfcon')
                    }else {
                        let minmony = card_sectime.secondsbank - 100;
                        await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {secondsbank: minmony}})
                        let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                        await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К`, {parse_mode: "HTML"})

                        await ctx.scene.enter('topfcon')
                    }
                }else {
                    await ctx.tg.sendMessage(card.chat_id, `🥇 Победитель:\n<a href="tg://user?id=${card.players[1].user_id}">${card.players[1].name}</a>`, {parse_mode: "HTML"})
                    if (card_sectime.totbank == 100) {
                        let minmony = card_sectime.frstsbank - 20;
                        await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {frstsbank: minmony}})
                        let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                        await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К`, {parse_mode: "HTML"})

                        await ctx.scene.enter('topfcon')
                    }else if (card_sectime.totbank == 300) {
                        let minmony = card_sectime.frstsbank - 60;
                        await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {frstsbank: minmony}})
                        let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                        await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К`, {parse_mode: "HTML"})

                        await ctx.scene.enter('topfcon')
                    }else {
                        let minmony = card_sectime.frstsbank - 100;
                        await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {frstsbank: minmony}})
                        let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                        await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К`, {parse_mode: "HTML"})

                        await ctx.scene.enter('topfcon')
                    }
                }
            }, 3000)
        }else {
            return
        }   
    }catch(e) {  
        console.error(e);
    }
})

const resultsnon = new Scenes.BaseScene("resultsnon");

resultsnon.enter(async ctx => {
    try {
            let cht = await collection.findOne({firschatid: ctx.chat.id});
            let chts = await collection.findOne({secondchatid: ctx.chat.id}); 
            if(cht != null) {
                await ctx.tg.sendMessage(cht.chat_id, 'Пришло время показать карты обеих участников...');
                let card = await collection.findOne({firschatid: cht.firschatid})
                let card_sectime = await collection.findOne({chat_id: card.chat_id})
                setTimeout(async () => {
                    await ctx.tg.sendPhoto(card.chat_id, {source: card.fpr}, {parse_mode: "HTML", caption: `🃏 Карта первого участника - <a href="tg://user?id=${card.players[0].user_id}">${card.players[0].name}</a>`})
                    await ctx.tg.sendPhoto(card.chat_id, {source: card.spr}, {parse_mode: "HTML", caption: `🃏 Карта первого участника - <a href="tg://user?id=${card.players[1].user_id}">${card.players[1].name}</a>`})
                    if(card.fpr == './M.png') {
                        await ctx.tg.sendMessage(card.chat_id, `🥇 Победитель:\n<a href="tg://user?id=${card.players[0].user_id}">${card.players[0].name}</a>`, {parse_mode: "HTML"})
                        if (card_sectime.totbank == 100) {
                            let minmony = card_sectime.secondsbank - 20;
                            await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {secondsbank: minmony}})
                            let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                            await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К`, {parse_mode: "HTML"})
    
                            await ctx.scene.enter('topfcon')
                        }else if (card_sectime.totbank == 300) {
                            let minmony = card_sectime.secondsbank - 60;
                            await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {secondsbank: minmony}})
                            let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                            await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К`, {parse_mode: "HTML"})
    
                            await ctx.scene.enter('topfcon')
                        }else {
                            let minmony = card_sectime.secondsbank - 100;
                            await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {secondsbank: minmony}})
                            let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                            await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К`, {parse_mode: "HTML"})
    
                            await ctx.scene.enter('topfcon')
                        }                        
                    }else {
                        await ctx.tg.sendMessage(card.chat_id, `🥇 Победитель:\n<a href="tg://user?id=${card.players[1].user_id}">${card.players[1].name}</a>`, {parse_mode: "HTML"})
                        if (card_sectime.totbank == 100) {
                            let minmony = card_sectime.frstsbank - 20;
                            await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {frstsbank: minmony}})
                            let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                            await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К`, {parse_mode: "HTML"})
    
                            await ctx.scene.enter('topfcon')
                        }else if (card_sectime.totbank == 300) {
                            let minmony = card_sectime.frstsbank - 60;
                            await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {frstsbank: minmony}})
                            let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                            await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К`, {parse_mode: "HTML"})
    
                            await ctx.scene.enter('topfcon')
                        }else {
                            let minmony = card_sectime.frstsbank - 100;
                            await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {frstsbank: minmony}})
                            let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                            await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К`, {parse_mode: "HTML"})
    
                            await ctx.scene.enter('topfcon')
                        }                        
                    }
                }, 3000)
            }else if(chts != null) {
                await ctx.tg.sendMessage(chts.chat_id, 'Пришло время показать карты обеих участников...');
                let card = await collection.findOne({secondchatid: chts.secondchatid})
                let card_sectime = await collection.findOne({chat_id: card.chat_id})
                setTimeout(async () => {
                    await ctx.tg.sendPhoto(card.chat_id, {source: card.fpr}, {parse_mode: "HTML", caption: `🃏 Карта первого участника - <a href="tg://user?id=${card.players[0].user_id}">${card.players[0].name}</a>`})
                    await ctx.tg.sendPhoto(card.chat_id, {source: card.spr}, {parse_mode: "HTML", caption: `🃏 Карта первого участника - <a href="tg://user?id=${card.players[1].user_id}">${card.players[1].name}</a>`})
                    if(card.fpr == './M.png') {
                        await ctx.tg.sendMessage(card.chat_id, `🥇 Победитель:\n<a href="tg://user?id=${card.players[0].user_id}">${card.players[0].name}</a>`, {parse_mode: "HTML"})
                        if (card_sectime.totbank == 100) {
                            let minmony = card_sectime.secondsbank - 20;
                            await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {secondsbank: minmony}})
                            let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                            await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К`, {parse_mode: "HTML"})
    
                            await ctx.scene.enter('topfcon')
                        }else if (card_sectime.totbank == 300) {
                            let minmony = card_sectime.secondsbank - 60;
                            await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {secondsbank: minmony}})
                            let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                            await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К`, {parse_mode: "HTML"})
    
                            await ctx.scene.enter('topfcon')
                        }else {
                            let minmony = card_sectime.secondsbank - 100;
                            await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {secondsbank: minmony}})
                            let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                            await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К`, {parse_mode: "HTML"})
    
                            await ctx.scene.enter('topfcon')
                        }
                    }else {
                        await ctx.tg.sendMessage(card.chat_id, `🥇 Победитель:\n<a href="tg://user?id=${card.players[1].user_id}">${card.players[1].name}</a>`, {parse_mode: "HTML"})
                        if (card_sectime.totbank == 100) {
                            let minmony = card_sectime.frstsbank - 20;
                            await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {frstsbank: minmony}})
                            let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                            await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К`, {parse_mode: "HTML"})
    
                            await ctx.scene.enter('topfcon')
                        }else if (card_sectime.totbank == 300) {
                            let minmony = card_sectime.frstsbank - 60;
                            await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {frstsbank: minmony}})
                            let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                            await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К`, {parse_mode: "HTML"})
    
                            await ctx.scene.enter('topfcon')
                        }else {
                            let minmony = card_sectime.frstsbank - 100;
                            await collection.findOneAndUpdate({chat_id: card_sectime.chat_id}, {$set: {frstsbank: minmony}})
                            let osbank = await collection.findOne({chat_id: card_sectime.chat_id})
                            await ctx.tg.sendMessage(osbank.chat_id, `Банк участника - <a href="tg://user?id=${osbank.players[0].user_id}">${osbank.players[0].name}</a>:\n${osbank.frstsbank}К\n\nБанк участника - <a href="tg://user?id=${osbank.players[1].user_id}">${osbank.players[1].name}</a>:\n${osbank.secondsbank}К`, {parse_mode: "HTML"})
    
                            await ctx.scene.enter('topfcon')
                        }
                    }
                }, 3000)
            }else {
                return
            }  
    }catch(e) {  
        console.error(e);
    }
})

// SCENE LEAVES

const leaves = new Scenes.BaseScene("leaves");

leaves.enter(async ctx => {
    try {
        let rest = await collection.findOne({_id: ObjectId('636e7752c7ac7456a91fb889')})
        let res = await rest.rooms - 1;
        await collection.findOneAndUpdate({_id: ObjectId('636e7752c7ac7456a91fb889')}, {$set: {rooms: res}});
        let cht = await collection.findOne({firschatid: ctx.chat.id});
        let chts = await collection.findOne({secondchatid: ctx.chat.id});    
        if(cht != null) {
            await ctx.tg.sendMessage(cht.chat_id, '🎮 Игра окончена\n➖➖➖➖➖➖➖➖➖➖\nЧтобы начать новую игру -> /newgame')
            await collection.findOneAndDelete({chat_id: cht.chat_id})
            await ctx.scene.leave("leaves")
        }else if(chts != null) {
            await ctx.tg.sendMessage(chts.chat_id, '🎮 Игра окончена\n➖➖➖➖➖➖➖➖➖➖\nЧтобы начать новую игру -> /newgame')
            await collection.findOneAndDelete({chat_id: chts.chat_id})
            await ctx.scene.leave("leaves")
        }else {
            return
        }   
    }catch(e) {
        console.error(e);
    }
})

// BOT DIRECTORY

const bot = new Telegraf(process.env.BOT_TOKEN);
const { MongoClient, ObjectId } = require('mongodb');  
const url = process.env.DB;
const client = new MongoClient(url);  
client.connect();
const db = client.db('bot');
const collection = db.collection('fnaf');
const stage = new Scenes.Stage([startGame, game, tofp, topfcon, speak, speakkon, quiz, results, resultsnon, leaves]);  
bot.use(session());
bot.use(stage.middleware());  
bot.launch({dropPendingUpdates: true});
bot.help((ctx) => ctx.reply('/newGame - для старта игры!\n➖➖➖➖➖➖➖➖➖➖\n\n/rules - правила игры\n\nPowered by @OG_DIMES'));
bot.command('newgame', async ctx => {  
    try {
        if(ctx.chat.type == 'supergroup') {
            let myrgh = await ctx.tg.getChatAdministrators(ctx.chat.id)
            let me = await ctx.tg.getMe()
            let mee = me.id;
            for (let i = 0; i < myrgh.length; i++) {
                if(myrgh[i].user.id == mee) {
                    let gameinchat = await collection.findOne({chat_id: ctx.chat.id})
                    if(gameinchat == null) {
                        await ctx.tg.deleteMessage(ctx.chat.id, ctx.message.message_id)
                        await ctx.scene.enter("startGame");
                    }else {
                        await ctx.reply('В данной группе идет игра! Ожидайте окончания...')
                    }
                    break
                }else {
                    await ctx.reply('Права администратора не выданы:\n➖➖➖➖➖➖➖➖➖➖\nУдалять сообщения  ❌')
                    break
                }
            }
        }else {
            await ctx.reply('Используйте даную команду в групповом чате')
        }
    }catch(e) {
        console.error(e);
    }
   
})

bot.command('skip', async ctx => {
    try {
        if(ctx.chat.type == 'supergroup') {
            let chat = await collection.findOne({chat_id: ctx.chat.id})
            if(chat == null) {
                await ctx.reply('Я не обнаружил игру в данной группе...');
            }else {
                let quatofsk = await collection.findOne({chat_id: ctx.chat.id})
                if(quatofsk.quatofsk == undefined) {
                    await ctx.scene.enter('quiz')
                }else {
                    await ctx.reply("Ожидайте выбор соперника...")
                }
                
            }
        }else {
            await ctx.reply('Используйте даную команду в групповом чате');
        }
        
    }catch(e) {
        console.error(e);
    }
})

bot.command('rules', async ctx => {
    try {
        await ctx.replyWithPhoto({source: './Preview.jpg'}, {...Markup.inlineKeyboard([[Markup.button.callback('🖲 Запустить игру', 'stgame')]]), caption: '👁‍🗨 Двум участникам рандомно раздают две разные карты, после чего одному из участников можно будет посмотреть на свою карту и убедить соперника обменять карты или оставить все как есть, но обменивает карты тот, кому не дали посмотреть на свою карту. А главное для участников в конце раунда остаться с деньгами а не с картой c "X"'})
    }catch(e) {
        console.error(e);
    }
})

bot.hears(['/start'], async ctx => {
    await ctx.replyWithHTML(`🪓 ПСЕВДОБОЛИЯ 💸\n\nЗдравствуй, я являюсь ведущим данной игры.\nПравила игры просты, чтобы прочитать их введи команду /rules\nИгра была придумана командой <a href="https://t.me/klikklaktg">"КликКлак"</a>\n\nДля начала игры добавь меня в группу:`, Markup.inlineKeyboard([[Markup.button.url('Добавить бота в группу 🌐', 'https://t.me/cheatandtake_bot?startgroup=true')], [Markup.button.url('Общая группа для игры 🎮', 'https://t.me/+6FoWRfkLEBZiMmRi')]]))
})

// ACTIONS

bot.action('stgame', async ctx => {
    try {
        if(ctx.chat.type == 'supergroup') {
            let myrgh = await ctx.tg.getChatAdministrators(ctx.chat.id)
            let me = await ctx.tg.getMe()
            let mee = me.id;
            for (let i = 0; i < myrgh.length; i++) {
                if(myrgh[i].user.id == mee) {
                    let gameinchat = await collection.findOne({chat_id: ctx.chat.id})
                    if(gameinchat == null) {
                        await ctx.tg.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.message_id)
                        await ctx.scene.enter("startGame");
                    }else {
                        await ctx.answerCbQuery('В данной группе идет игра! Ожидайте окончания...', {show_alert: false})
                    }
                    break
                }else {
                    await ctx.reply('Права администратора не выданы:\n➖➖➖➖➖➖➖➖➖➖\nУдалять сообщения  ❌')
                    break
                }
            }
        }else {
            await ctx.answerCbQuery('Используйте даную кнопку в групповом чате', {show_alert: false})
        }
    }catch(e) {
        console.error(e);  
    }
})


bot.start(async ctx => {
    try {
        let startPlayload = await  Number(ctx.startPayload) 
        let group = await ctx.tg.getChat(startPlayload);
        let gminchat = await collection.findOne({chat_id: startPlayload})
        if(gminchat == null) {
            await ctx.reply(`В группе "${group.title}" в данный момент не идет игра...`)
        }else {
            if (gminchat.startgameend == 'yes') {
                await ctx.reply('Игра уже запущена...')
            }else {
                let useringame = await collection.findOne({players: {user_name: ctx.message.from.username, user_id: ctx.message.from.id, perschat: ctx.chat.id, name: ctx.message.from.first_name}})
                if (useringame == null) {
                    await collection.findOneAndUpdate({chat_id: startPlayload}, {$push: {players: {user_name: ctx.message.from.username, user_id: ctx.message.from.id, perschat: ctx.chat.id, name: ctx.message.from.first_name}}}) 
                    await ctx.replyWithHTML(`Вы успешно присоеденились к игре: <a href="${group.invite_link}">${group.title}</a>`)
                    let startgmleng = await collection.findOne({chat_id: startPlayload})
                    if(startgmleng.players.length == 1) {
                        let editedmsg = await ctx.telegram.editMessageCaption(startgmleng.chat_id, startgmleng.tst, ctx.inlineMessageId, `Игроки:\n@${startgmleng.players[0].user_name}`, {
                            ...Markup.inlineKeyboard([[Markup.button.url('🔁 Присоединиться', `https://t.me/cheatandtake_bot?start=${startPlayload}`)]])})
                        await collection.findOneAndUpdate({chat_id: startgmleng.chat_id}, {$set: {firschatid: ctx.chat.id}})
                        await collection.findOneAndUpdate({chat_id: startgmleng.chat_id}, {$set: {tst: editedmsg.message_id}})
                    }else {
                        await collection.findOneAndUpdate({chat_id: startgmleng.chat_id}, {$set: {secondchatid: ctx.chat.id}})
                        await collection.findOneAndUpdate({chat_id: startgmleng.chat_id}, {$set: {startgameend: 'yes'}})
                        let gamesearch = await collection.findOne({chat_id: startgmleng.chat_id})
                        let stavedmsg = await ctx.telegram.editMessageCaption(gamesearch.chat_id, gamesearch.tst, ctx.inlineMessageId, `<a href="tg://user?id=${gamesearch.players[0].user_id}">${gamesearch.players[0].name}</a> и <a href="tg://user?id=${gamesearch.players[1].user_id}">${gamesearch.players[1].name}</a>, пусть один из вас выберет общий банк для обоих участников:`, {
                            ...Markup.inlineKeyboard([
                                [Markup.button.callback('100К', `onezerozero`), Markup.button.callback('300К', `threezerozero`), Markup.button.callback('500К', `fivezerozero`)]
                        ]), parse_mode: "HTML"})

                        await collection.findOneAndUpdate({chat_id: gamesearch.chat_id}, {$set: {tst: stavedmsg.message_id}})
                    }                     
                }else {
                    await ctx.reply('Вы уже участвуете 🟢')
                } 
            }
        } 
    }catch(e) {
        console.error(e);
    }
})

bot.action('onezerozero', async ctx => {
    try {
        let chatgm = await collection.findOne({chat_id: ctx.chat.id})
        let useringamfirst = await collection.findOne({players: {user_name: ctx.callbackQuery.from.username, user_id: ctx.callbackQuery.from.id, perschat: chatgm.firschatid, name: ctx.callbackQuery.from.first_name}})
        let useringamsecond = await collection.findOne({players: {user_name: ctx.callbackQuery.from.username, user_id: ctx.callbackQuery.from.id, perschat: chatgm.secondchatid, name: ctx.callbackQuery.from.first_name}})

        if (useringamfirst != null) {
            if(useringamfirst == null) {
                await ctx.answerCbQuery('Вы не участвуете в данной игре...', {show_alert: false})
            }else {
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {frstsbank: 100}})
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {secondsbank: 100}})
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {totbank: 100}})
                let chostotbank = await collection.findOne({chat_id: ctx.chat.id});
                await ctx.answerCbQuery('Общий банк - 100К', {show_alert: false})
                await ctx.scene.enter('game')
            }
        }else if(useringamsecond != null) {
            if(useringamsecond == null) {
                await ctx.answerCbQuery('Вы не участвуете в данной игре...', {show_alert: false})
            }else {
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {frstsbank: 100}})
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {secondsbank: 100}})
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {totbank: 100}})
                await ctx.answerCbQuery('Общий банк - 100К', {show_alert: false})
                await ctx.scene.enter('game')
            }
        }else {
            await ctx.answerCbQuery('Вы не участвуете в данной игре...', {show_alert: false})
        }
    }catch(e) {
        console.error(e);
    }
})

bot.action('threezerozero', async ctx => {
    try {
        let chatgm = await collection.findOne({chat_id: ctx.chat.id})
        let useringamfirst = await collection.findOne({players: {user_name: ctx.callbackQuery.from.username, user_id: ctx.callbackQuery.from.id, perschat: chatgm.firschatid, name: ctx.callbackQuery.from.first_name}})
        let useringamsecond = await collection.findOne({players: {user_name: ctx.callbackQuery.from.username, user_id: ctx.callbackQuery.from.id, perschat: chatgm.secondchatid, name: ctx.callbackQuery.from.first_name}})

        if (useringamfirst != null) {
            if(useringamfirst == null) {
                await ctx.answerCbQuery('Вы не участвуете в данной игре...', {show_alert: false})
            }else {
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {frstsbank: 300}})
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {secondsbank: 300}})
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {totbank: 300}})
                await ctx.answerCbQuery('Общий банк - 300К', {show_alert: false})
                await ctx.scene.enter('game')
            }
        }else if(useringamsecond != null) {
            if(useringamsecond == null) {
                await ctx.answerCbQuery('Вы не участвуете в данной игре...', {show_alert: false})
            }else {
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {frstsbank: 300}})
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {secondsbank: 300}})
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {totbank: 300}})
                await ctx.answerCbQuery('Общий банк - 300К', {show_alert: false})
                await ctx.scene.enter('game')
            }
        }else {
            await ctx.answerCbQuery('Вы не участвуете в данной игре...', {show_alert: false})
        }
    }catch(e) {
        console.error(e);
    }
})

bot.action('fivezerozero', async ctx => {
    try {
        let chatgm = await collection.findOne({chat_id: ctx.chat.id})
        let useringamfirst = await collection.findOne({players: {user_name: ctx.callbackQuery.from.username, user_id: ctx.callbackQuery.from.id, perschat: chatgm.firschatid, name: ctx.callbackQuery.from.first_name}})
        let useringamsecond = await collection.findOne({players: {user_name: ctx.callbackQuery.from.username, user_id: ctx.callbackQuery.from.id, perschat: chatgm.secondchatid, name: ctx.callbackQuery.from.first_name}})

        if (useringamfirst != null) {
            if(useringamfirst == null) {
                await ctx.answerCbQuery('Вы не участвуете в данной игре...', {show_alert: false})
            }else {
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {frstsbank: 500}})
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {secondsbank: 500}})
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {totbank: 500}})
                await ctx.answerCbQuery('Общий банк - 500К', {show_alert: false})
                await ctx.scene.enter('game')
            }
        }else if(useringamsecond != null) {
            if(useringamsecond == null) {
                await ctx.answerCbQuery('Вы не участвуете в данной игре...', {show_alert: false})
            }else {
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {frstsbank: 500}})
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {secondsbank: 500}})
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {totbank: 500}})
                await ctx.answerCbQuery('Общий банк - 500К', {show_alert: false})
                await ctx.scene.enter('game')
            }
        }else {
            await ctx.answerCbQuery('Вы не участвуете в данной игре...', {show_alert: false})
        }
    }catch(e) {
        console.error(e);
    }
})

// bot.action('joinnext', async ctx => {
//     try {
//         let findch = await collection.findOne({chat_id: ctx.chat.id});
//         let editedmsg = await ctx.telegram.editMessageCaption(ctx.chat.id, findch.tst, ctx.callbackQuery.inline_message_id, `...`, {
//             ...Markup.inlineKeyboard([[Markup.button.url('🔁 Присоединиться', 'https://t.me/cheatandtake_bot?start=G')]])
//         })
//         await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {tst: editedmsg.message_id}})
//         bot.start(async (ctxx) => {
//             let useringame = await collection.findOne({players: {user_name: ctxx.message.from.username, user_id: ctxx.message.from.id, perschat: ctxx.chat.id, name: ctxx.message.from.first_name}})
//             if (useringame == null) {
//                 await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$push: {players: {user_name: ctxx.message.from.username, user_id: ctxx.message.from.id, perschat: ctxx.chat.id, name: ctxx.message.from.first_name}}})
//                 let sfin = await collection.findOne({chat_id: ctx.chat.id});
//                 let getcmem = await ctxx.tg.getChatMember(sfin.chat_id, ctxx.message.from.id)
//                 if(getcmem) {
//                     await ctxx.replyWithHTML(`Вы присоеденились к игре: <b>${ctx.chat.title}</b>`)
//                 }else {
//                     return
//                 }
//                 if(sfin.players.length == 1) {
//                     await ctx.telegram.editMessageCaption(ctx.chat.id, sfin.tst, ctx.callbackQuery.inline_message_id, `Игроки:\n@${sfin.players[0].user_name}`, {
//                         ...Markup.inlineKeyboard([[Markup.button.url('🔁 Присоединиться', 'https://t.me/cheatandtake_bot?start=G')]])})
//                     await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {firschatid: ctxx.chat.id}})
//                 }else {
//                     ctx.scene.enter("game")
//                     await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {secondchatid: ctxx.chat.id}})
//                 }    
//             }else {
//                 await ctxx.reply('Вы уже участвуете...')
//             }      
//         }) 
//     }catch(e) {
//         console.error(e);
//     }  
// })   


bot.action("non", async ctx => {
    try {
        let findchqzq = await collection.findOne({firschatid: ctx.chat.id});
        let findchqsq = await collection.findOne({secondchatid: ctx.chat.id});
        if(findchqzq != null) {
            let findchqz = await collection.findOne({firschatid: ctx.chat.id});
            if(findchqz.forfirst == true) {
                await ctx.tg.deleteMessage(ctx.chat.id, findchqz.tofmi);
                let res = await findchqz.hq + 1;
                await collection.findOneAndUpdate({firschatid: ctx.chat.id}, {$set: {hq: res}});
                await collection.findOneAndUpdate({firschatid: ctx.chat.id}, {$set: {fcl: 'yes'}});
                await ctx.answerCbQuery('Принято.', {show_alert: false})
                await ctx.tg.sendMessage(findchqz.chat_id, `<a href="tg://user?id=${findchqz.players[0].user_id}">${findchqz.players[0].name}</a> решил(а) не менять карты`, {parse_mode: "HTML"})
                let totac = await collection.findOne({firschatid: ctx.chat.id})
                if(totac.hq == 1) {
                    await ctx.scene.enter("resultsnon")
                }else {
                    return
                }
            }else {
                return
            }
        }else if(findchqsq != null) {
            let findchqs = await collection.findOne({secondchatid: ctx.chat.id});
            if(findchqs.forsecond == true) {
                await ctx.tg.deleteMessage(ctx.chat.id, findchqs.sofmi);
                let res = await findchqs.hq + 1;
                await collection.findOneAndUpdate({secondchatid: ctx.chat.id}, {$set: {hq: res}});
                await collection.findOneAndUpdate({secondchatid: ctx.chat.id}, {$set: {scl: 'yes'}});
                await ctx.answerCbQuery('Принято.', {show_alert: false})
                await ctx.tg.sendMessage(findchqs.chat_id, `<a href="tg://user?id=${findchqs.players[1].user_id}">${findchqs.players[1].name}</a> решил(а) не менять карты`, {parse_mode: "HTML"})
                let totac = await collection.findOne({secondchatid: ctx.chat.id})
                if(totac.hq == 1) {
                    await ctx.scene.enter("resultsnon")
                }else {
                    return
                } 
            }
        }else {
            await ctx.answerCbQuery('Вы вне игры') 
        }  
    }catch(e) {
        console.error(e);
    }
})

bot.action('ye', async ctx => {
    try {
        let findchqzq = await collection.findOne({firschatid: ctx.chat.id});
        let findchqsq = await collection.findOne({secondchatid: ctx.chat.id});

        if(findchqzq != null) {
            let findchqz = await collection.findOne({firschatid: ctx.chat.id});
            if(findchqz.forfirst == true) {
                await ctx.tg.deleteMessage(ctx.chat.id, findchqz.tofmi);
                let res = await findchqz.hq + 1;
                await collection.findOneAndUpdate({firschatid: ctx.chat.id}, {$set: {hq: res}});
                await collection.findOneAndUpdate({firschatid: ctx.chat.id}, {$set: {fcl: 'yes'}});
                await ctx.answerCbQuery('Меняю...', {show_alert: false})
                await ctx.tg.sendMessage(findchqz.chat_id, `<a href="tg://user?id=${findchqz.players[0].user_id}">${findchqz.players[0].name}</a> решил(а) поменять карты`, {parse_mode: "HTML"})
                // let card = await collection.findOne({firschatid: ctx.chat.id});
                // if(card.fpr == './X.png') {
                //     await collection.findOneAndUpdate({firschatid: ctx.chat.id}, {$set: {fpr: './M.png'}})
                //     await collection.findOneAndUpdate({firschatid: ctx.chat.id}, {$set: {spr: './X.png'}})
                // }else {
                //     await collection.findOneAndUpdate({firschatid: ctx.chat.id}, {$set: {fpr: './X.png'}})
                //     await collection.findOneAndUpdate({firschatid: ctx.chat.id}, {$set: {spr: './M.png'}})
                // }
                let totac = await collection.findOne({firschatid: ctx.chat.id})
                if(totac.hq == 1) {
                    await ctx.scene.enter("results")
                }else {
                    return
                }
            }else {
                return
            }
        }else if(findchqsq != null) {
            let findchqs = await collection.findOne({secondchatid: ctx.chat.id});
            if(findchqs.forsecond == true) {
                await ctx.tg.deleteMessage(ctx.chat.id, findchqs.sofmi);
                let res = await findchqs.hq + 1;
                await collection.findOneAndUpdate({secondchatid: ctx.chat.id}, {$set: {hq: res}});
                await collection.findOneAndUpdate({secondchatid: ctx.chat.id}, {$set: {scl: 'yes'}});
                await ctx.answerCbQuery('Меняю...', {show_alert: false})
                await ctx.tg.sendMessage(findchqs.chat_id, `<a href="tg://user?id=${findchqs.players[1].user_id}">${findchqs.players[1].name}</a> решил(а) поменять карты`, {parse_mode: "HTML"})
                // let card = await collection.findOne({secondchatid: ctx.chat.id});
                // if(card.spr == './X.png') {
                //     await collection.findOneAndUpdate({secondchatid: ctx.chat.id}, {$set: {spr: './M.png'}})
                //     await collection.findOneAndUpdate({secondchatid: ctx.chat.id}, {$set: {fpr: './X.png'}})
                // }else {
                //     await collection.findOneAndUpdate({secondchatid: ctx.chat.id}, {$set: {spr: './X.png'}})
                //     await collection.findOneAndUpdate({secondchatid: ctx.chat.id}, {$set: {fpr: './M.png'}})
                // }
                let totac = await collection.findOne({secondchatid: ctx.chat.id})
                if(totac.hq == 1) {
                    await ctx.scene.enter("results")
                }else {
                    return
                } 
            }
        }else {
            await ctx.answerCbQuery('Вы вне игры...') 
        }  
    }catch(e) {
        console.error(e);
    }
})


// HANDLERS

// bot.on("message", async ctx => {
//     try {
//         let chatDontSp = await collection.findOne({chat_id: ctx.chat.id})
//         if (chatDontSp == null) {
//             return
//         }else {
//             await ctx.deleteMessage(ctx.message.message_id)
//         }
//     }catch(e) {
//         console.error(e);
//     }
// })

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));