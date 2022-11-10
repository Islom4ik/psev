const { Scenes, session, Telegraf, Markup } = require ("telegraf");
require('dotenv').config();
const { enter, leave } = Scenes.Stage;

// SCENE STARTGAME

const startGame = new Scenes.BaseScene("startGame");

startGame.enter(async ctx => {
    try {
        let chat = await collection.findOne({chat_id: ctx.chat.id});
        if(chat == null) {
            let chtop = await collection.findOne({_id: ObjectId('63660b4aafcbb5908ea11437')});
            let chres = await chtop.rooms + 1
            await collection.findOneAndUpdate({_id: ObjectId('63660b4aafcbb5908ea11437')}, {$set: {rooms: chres}});
            let roomc = await collection.findOne({_id: ObjectId('63660b4aafcbb5908ea11437')})
            await collection.insertOne(
                {
                    room: roomc.rooms,
                    players: [],
                    chat_id: ctx.chat.id,
                    fcl: 'no',
                    scl: 'no',
                    hq: 0,
                    tofmi: 0,
                    sofmi: 0  
                }
            ) 
            let tstart = await ctx.replyWithPhoto({source: './preview.png'}, {
                ...Markup.inlineKeyboard(
                    [
                        [Markup.button.callback('🔁 Присоединиться', 'joinnext')]
                    ]
                ), caption: `Ожидание игроков...`
            })
            await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {tst: `${tstart.message_id}`}}) 
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
        await ctx.replyWithHTML(`<b>${findch.players[0].user_name}</b> VS <b>${findch.players[1].user_name}</b>`);
        await ctx.scene.enter("tofp");
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
        if(random == 1) {
            await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {fpr: './M.png'}})
            await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {spr: './X.png'}})
        }else {  
            await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {fpr: './X.png'}})
            await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {spr: './M.png'}})
        }  
      
        let findcar = await collection.findOne({chat_id: ctx.chat.id});
    
        if(whoview == 0) {
            await ctx.tg.sendPhoto(findcar.players[0].perschat, {source: findcar.fpr}, {caption: 'Вам дали посмотреть вашу карту'});
            await ctx.reply(`Игроку @${findcar.players[0].user_name} дали возможность посмотреть на свою карту...`)
            await ctx.tg.sendPhoto(findcar.players[1].perschat, {source: './q.png'}, {caption: 'Вам неизвестно какая у вас карта :/'});
            await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {forfirst: false}})
            await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {forsecond: true}})
        }else {
            await ctx.tg.sendPhoto(findcar.players[0].perschat, {source: './q.png'}, {caption: 'Вам неизвестно какая у вас карта :/'});
            await ctx.tg.sendPhoto(findcar.players[1].perschat, {source: findcar.fpr}, {caption: 'Вам дали посмотреть вашу карту'});
            await ctx.reply(`Игроку @${findcar.players[1].user_name} дали возможность посмотреть на свою карту...`)
            await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {forfirst: true}})
            await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {forsecond: false}})
        }
    
        await ctx.scene.enter("speak")
    }catch(e) {
        console.error(e);
    }
})

// SCENE SPEAK

const speak = new Scenes.BaseScene("speak");

speak.enter(async (ctx) => {
    try {
        await ctx.reply('Игра началась!\nВы можете переговориться о будущем обмене карт или оставить все по прежне. Удачи!')
        setTimeout(async () => {
            await ctx.scene.enter("quiz")   
        }, 180000) /* 180000 */
    }catch(e) {
        console.error(e);
    }
})

speak.on('message', async ctx => {
    let user = await collection.findOne({chat_id: ctx.message.from.id})/* user_id */
    if (user.players[0].user_id || user.players[1].user_id == ctx.message.from.username) {
        return
    }else {
        await ctx.tg.deleteMessage(user.chat_id, ctx.message.message_id)
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
            await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {tofmi: `${tofu.message_id}`}});
            await ctx.replyWithHTML(`@${findch.players[0].user_name}, пришло время действовать...\n\nПерейдите в лс <a href="https://t.me/dprodqbot">боту</a> и примите решение...\nВсе зависит только от вас!`);
        }else if(findch.forsecond == true) {
            let tosu = await ctx.telegram.sendMessage(findch.players[1].perschat, 'Хочешь поменять карты?', {
                ...Markup.inlineKeyboard(
                    [
                        [Markup.button.callback('Да, меняй', 'ye'), Markup.button.callback('Нет, оставим', 'non')]
                    ]
                ).resize().oneTime()
            });
            await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {sofmi: `${tosu.message_id}`}});
            await ctx.replyWithHTML(`@${findch.players[1].user_name}, пришло время действовать...\n\nПерейдите в лс <a href="https://t.me/dprodqbot">боту</a> и примите решение...\nВсе зависит только от вас!`);
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
                await ctx.tg.sendPhoto(card.chat_id, {source: card.fpr}, {caption: `Карта первого участника @${card.players[0].user_name}`})
                await ctx.tg.sendPhoto(card.chat_id, {source: card.spr}, {caption: `Карта первого участника @${card.players[1].user_name}`})
                if(card.fpr == './M.png') {
                    await ctx.tg.sendMessage(card.chat_id, `Победитель:\n@${card.players[0].user_name} Money - +100$`)
                }else {
                    await ctx.tg.sendMessage(card.chat_id, `Победитель:\n@${card.players[1].user_name} Money - +100$`)
                }
                await ctx.scene.enter('leaves')
            }, 3000)
        }else if(chts != null) {
            await ctx.tg.sendMessage(chts.chat_id, 'Пришло время показать карты обеих участников...');
            let card = await collection.findOne({secondchatid: chts.secondchatid})
            setTimeout(async () => {
                await ctx.tg.sendPhoto(card.chat_id, {source: card.fpr}, {caption: `Карта первого участника @${card.players[0].user_name}`})
                await ctx.tg.sendPhoto(card.chat_id, {source: card.spr}, {caption: `Карта первого участника @${card.players[1].user_name}`})
                if(card.fpr == './M.png') {
                    await ctx.tg.sendMessage(card.chat_id, `Победитель:\n@${card.players[0].user_name} Money - +100$`)
                }else {
                    await ctx.tg.sendMessage(card.chat_id, `Победитель:\n@${card.players[1].user_name} Money - +100$`)
                }
                await ctx.scene.enter('leaves')
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
            setTimeout(async () => {
                await ctx.tg.sendPhoto(card.chat_id, {source: card.fpr}, {caption: `Карта первого участника @${card.players[0].user_name}`})
                await ctx.tg.sendPhoto(card.chat_id, {source: card.spr}, {caption: `Карта первого участника @${card.players[1].user_name}`})
                if(card.fpr == './M.png') {
                    await ctx.tg.sendMessage(card.chat_id, `Победитель:\n@${card.players[0].user_name}`)
                    await ctx.scene.enter('leaves')
                }else {
                    await ctx.tg.sendMessage(card.chat_id, `Победитель:\n@${card.players[1].user_name}`)
                    await ctx.scene.enter('leaves')
                }
            }, 3000)
        }else if(chts != null) {
            await ctx.tg.sendMessage(chts.chat_id, 'Пришло время показать карты обеих участников...');
            let card = await collection.findOne({secondchatid: chts.secondchatid})
            setTimeout(async () => {
                await ctx.tg.sendPhoto(card.chat_id, {source: card.fpr}, {caption: `Карта первого участника @${card.players[0].user_name}`})
                await ctx.tg.sendPhoto(card.chat_id, {source: card.spr}, {caption: `Карта первого участника @${card.players[1].user_name}`})
                if(card.fpr == './M.png') {
                    await ctx.tg.sendMessage(card.chat_id, `Победитель:\n@${card.players[0].user_name}`)
                    await ctx.scene.enter('leaves')
                }else {
                    await ctx.tg.sendMessage(card.chat_id, `Победитель:\n@${card.players[1].user_name}`)
                    await ctx.scene.enter('leaves')
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
        let rest = await collection.findOne({_id: ObjectId('63660b4aafcbb5908ea11437')})
        let res = await rest.rooms - 1;
        await collection.findOneAndUpdate({_id: ObjectId('63660b4aafcbb5908ea11437')}, {$set: {rooms: res}});
        let cht = await collection.findOne({firschatid: ctx.chat.id});
        let chts = await collection.findOne({secondchatid: ctx.chat.id});    
        if(cht != null) {
            await ctx.tg.sendMessage(cht.chat_id, 'Игра окончена\n➖➖➖➖➖➖➖➖➖➖\nЧтобы начать новую игру -> /newgame')
            await collection.findOneAndDelete({chat_id: cht.chat_id})
            await ctx.scene.leave("leaves")
        }else if(chts != null) {
            await ctx.tg.sendMessage(chts.chat_id, 'Игра окончена\n➖➖➖➖➖➖➖➖➖➖\nЧтобы начать новую игру -> /newgame')
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
const stage = new Scenes.Stage([startGame, game, tofp, speak, quiz, results, resultsnon, leaves]);  
bot.use(session());
bot.use(stage.middleware());  
bot.launch({dropPendingUpdates: true});
bot.help((ctx) => ctx.reply('/newGame - для старта игры!'));
bot.command('newgame', async ctx => {  
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
})

bot.command('rules', async ctx => {
    try {
        await ctx.reply('Двум участникам раздают рандомно две разный карты, после чего одному из участнику можно будет посмотреть на свою карту и убедить соперника обменять карты или оставить все как есть.\nГлавное для обеих участников в конце раунда остаться с деньгами а не с картой X')
    }catch(e) {
        console.error(e);
    }
})

bot.hears(['/start'], async ctx => {
    await ctx.replyWithHTML(`Приветствую вас <b>${ctx.message.from.first_name}</b>!\nЯ бот который введу игру ОБМАНУЛ - ПОЛУЧИЛ\nДля начала добавь меня в группу`, Markup.inlineKeyboard([[Markup.button.url('Добавить бота в группу 🌐', 'https://t.me/cheatandtake_bot?startgroup=true')]]))
})

// ACTIONS

bot.action('joinnext', async ctx => {
    try {
        let findch = await collection.findOne({chat_id: ctx.chat.id});
        let editedmsg = await ctx.telegram.editMessageCaption(ctx.chat.id, findch.tst, ctx.callbackQuery.inline_message_id, `Ожидание игроков:`, {
            ...Markup.inlineKeyboard([[Markup.button.url('🔁 Присоединиться', 'https://t.me/cheatandtake_bot?start=G')]])
        })
        bot.start(async (ctxx) => {
                await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$push: {players: {user_name: ctxx.message.from.username, user_id: ctxx.message.from.id, perschat: ctxx.chat.id}}})
                let sfin = await collection.findOne({chat_id: ctx.chat.id});
                let getcmem = await ctxx.tg.getChatMember(findch.chat_id, sfin.players[0].user_id)
                if(getcmem) {
                    await ctxx.replyWithHTML(`Вы присоеденились к игре: <b>${ctx.chat.title}</b>`)
                }else {
                    return
                }
                if(sfin.players.length == 1) {
                    let chmsg = await ctx.telegram.editMessageCaption(ctx.chat.id, findch.tst, ctx.callbackQuery.inline_message_id, `Игроки: @${sfin.players[0].user_name}`, {
                        ...Markup.inlineKeyboard([[Markup.button.url('🔁 Присоединиться', 'https://t.me/cheatandtake_bot?start=G')]])})
                    await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {firschatid: ctxx.chat.id}})
                }else {
                    ctx.scene.enter("game")
                    await collection.findOneAndUpdate({chat_id: ctx.chat.id}, {$set: {secondchatid: ctxx.chat.id}})
                }
        }) 
    }catch(e) {
        console.error(e);
    }  
}) 


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
                await ctx.answerCbQuery('Меняю...', {show_alert: false})
                await ctx.tg.sendMessage(findchqz.chat_id, `@${findchqz.players[0].user_name} решил(а) не менять карты`)
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
                await ctx.answerCbQuery('Меняю...', {show_alert: false})
                await ctx.tg.sendMessage(findchqs.chat_id, `@${findchqs.players[1].user_name} решил(а) не менять карты`)
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
                await ctx.tg.sendMessage(findchqz.chat_id, `@${findchqz.players[0].user_name} решил(а) поменять карты`)
                let card = await collection.findOne({firschatid: ctx.chat.id});
                if(card.fpr == './X.png') {
                    await collection.findOneAndUpdate({firschatid: ctx.chat.id}, {$set: {fpr: './M.png'}})
                    await collection.findOneAndUpdate({firschatid: ctx.chat.id}, {$set: {spr: './X.png'}})
                }else {
                    await collection.findOneAndUpdate({firschatid: ctx.chat.id}, {$set: {fpr: './X.png'}})
                    await collection.findOneAndUpdate({firschatid: ctx.chat.id}, {$set: {spr: './M.png'}})
                }
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
                await ctx.tg.sendMessage(findchqs.chat_id, `@${findchqs.players[1].user_name} решил(а) поменять карты`)
                let card = await collection.findOne({secondchatid: ctx.chat.id});
                if(card.spr == './X.png') {
                    await collection.findOneAndUpdate({secondchatid: ctx.chat.id}, {$set: {fpr: './X.png'}})
                    await collection.findOneAndUpdate({secondchatid: ctx.chat.id}, {$set: {spr: './M.png'}})
                }else {
                    await collection.findOneAndUpdate({secondchatid: ctx.chat.id}, {$set: {fpr: './M.png'}})
                    await collection.findOneAndUpdate({secondchatid: ctx.chat.id}, {$set: {spr: './X.png'}})
                }
                let totac = await collection.findOne({secondchatid: ctx.chat.id})
                if(totac.hq == 1) {
                    await ctx.scene.enter("results")
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


// HANDLERS

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));