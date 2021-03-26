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

        actor = new game.dnd5e.entities.Actor5e(freedomFighterObj);
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
    delete dupActor["folder"];
    delete dupActor["sort"];
    await canvas.scene.setFlag("token-independence", name, dupActor);
    
    // This next line is to make this Token-Independence module compatible with the Token Mold module, which renames token.data.name, instead of just token.actorData.name
    canvas.tokens.updateAll(t => ({name: actor.name}), t => t.data.actorId === actor._id);
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

// Add a button to the actor Sidebar, that when clicked will render a Dialog with options.
Hooks.on("renderSidebarTab", async (app, html) => {
    // This script is only for a GM
    if(game.user.isGM) {
        // Create a button that when clicked, will create the actor "DDB Temp Actor".  Insert the button before the search field on the Actor tab.
        let button = $("<div class='header-actions action-buttons flexrow'><button class='ddb-import'>Token Independence</button>")
        button.click(function () {
            createDialog();
        });
        html.find("div.header-search.flexrow").before(button);}
})

function createDialog() {
    const title = `Token-Independence Options`;
    const content = ``;
    const buttons = {Remove: {label: "Remove embedded actors from scene", callback: () => {removeActors()}}}
    dialog = new Dialog({title, content, buttons}).render(true);
}

function removeActors() {
    const sceneName = canvas.scene.data.name;
    const title = `Remove embedded actors from scene "${sceneName}"`;
    let content = ``;
    let buttons = {}
    const isIndFlag = canvas.scene.data.flags.hasOwnProperty("token-independence");
    if (!isIndFlag) {
        content = `There are no embedded actors in this scene`;
        buttons = {Exit: {label: "Exit", callback: () => {dialog.close()}}};
    } else {
        const keys = Object.keys(canvas.scene.data.flags["token-independence"]);
        content =   `<h2>Select actors and Remove or Remove All</h2>
                    <div>
                        <table>`
        for (actor of keys) {
            content +=  `<tr>
                            <td style="width: 30px"><input type="checkbox" id="check" name="${actor}" value="${actor}"></td>
                            <td style="text-align: left"><label for="${actor}">${actor}</label>
                        </tr>`
        }
        content += `</table></div>`
        buttons = { Delete: {label: "Remove Selected", callback: (html) => {deleteActors(html)}},
                    DeleteAll: {label: "Remove All", callback: (html) => {deleteActors(html, keys)}}}
    }
    dialog.data.title = title;
    dialog.data.buttons = buttons;
    dialog.data.content = content;
    dialog.render(true);
    const dialogDOM = document.querySelector(`#${dialog.id}`);
    dialogDOM.style.height = "";
    dialog.position.height = null;
}

async function deleteActors(html, Arr = []) {
    debugger;
    if (Arr.length === 0) {
        const cbs = html.find('[id="check"]');  // array
        for (const cb of cbs) {
            if (cb.checked) {
                Arr.push(cb.value);
            }
        }
    }
    for (const actor of Arr) {
        await canvas.scene.unsetFlag("token-independence", actor);
    }
}
