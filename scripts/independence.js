Hooks.on('canvasReady', () =>  {
    
    const IndTokenArr = [];
    const TokenArr = canvas.tokens.placeables;
    for (const token of TokenArr) {
        if (!token.actor) IndTokenArr.push(token);
    }

    if (IndTokenArr.length === 0) return;

    const isIndFlag = canvas.scene.data.flags.hasOwnProperty("token-independence");
    if (!isIndFlag) {
        ui.notifications.info("There are abandoned Tokens in scene, but the Token Independence module was not around to give them their freedom.");
        return;
    }

    for (const token of IndTokenArr) {
        const name = token.data.name;
        const freedomFighterObj = canvas.scene.data.flags["token-independence"][name];
        if (!freedomFighterObj) {
            ui.notifications.info(`Token Independence freed other tokens, but not ${name}s`);
            continue;
        }

        actor = new Actor(freedomFighterObj);
        synthActor = actor.constructor.createTokenActor(actor, token);
        token.actor = synthActor;
    }
})

Hooks.on('preDeleteActor', async (actor, options, userId) => {
    const name = actor.name;
    const tokenArr = actor.getActiveTokens();
    if (tokenArr.length === 0) return;
    const isIndFlag = canvas.scene.data.flags.hasOwnProperty("token-independence");
    if (isIndFlag) {
        const isFreedomFighter = canvas.scene.data.flags["token-independence"][name] ? true : false;
        if (isFreedomFighter) return;
    }

    const dupActor = duplicate(actor);
    delete dupActor["flags"];
    delete dupActor["folder"];
    delete dupActor["token"];
    delete dupActor["sort"];
    await canvas.scene.setFlag("token-independence", name, dupActor);
})

Hooks.on('deleteToken', async (scene, token, options, userId) => {
    const TokenArr = canvas.tokens.placeables;
    const TokenActorArr = TokenArr.filter(n => n.data.name === token.name);
    if (TokenActorArr.length > 0) return;

    const isIndFlag = canvas.scene.data.flags.hasOwnProperty("token-independence");
    if (!isIndFlag) return;

    await canvas.scene.unsetFlag("token-independence", token.name);
})

Hooks.on('pasteToken', (tokenCollection, tokenArray) => {
    canvas.draw();
})
