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

Hooks.on('pasteToken', (tokenCollection, tokenArray) => {
    canvas.draw();
})

// Add a button to the actor Sidebar, that when clicked will render a Dialog with options.
Hooks.on("renderSidebarTab", async (app, html) => {
    // This script is only for a GM
    if(game.user.isGM) {
        // Only render on Actors tab
        if (app.options.id == "actors") {
            // Create a button that when clicked, will create the actor "DDB Temp Actor".  Insert the button before the search field on the Actor tab.
            let button = $("<div class='header-actions action-buttons flexrow'><button class='ddb-import'>Token Independence</button>")
            button.click(function () {
                createDialog();
            });
            html.find("div.header-search.flexrow").before(button);
        }
    }
})

function createDialog() {
    const title = `Token-Independence Options`;
    const content = `<style>#TIoptionButtons .dialog-buttons {flex-direction: column;}</style>`;
    const buttons = {   
                    Add: {label: "Embed actor(s) into scene", callback: () => {addActors()}},
                    Remove: {label: "Remove embedded actor(s) from scene", callback: () => {removeActors()}}
                    }
    dialog = new Dialog({title, content, buttons}, {id: "TIoptionButtons"}).render(true);
}

function removeActors() {
    const sceneName = canvas.scene.data.name;
    const title = `Remove embedded actors from scene "${sceneName}"`;
    let content = ``;
    let buttons = {}
    const isIndFlag = canvas.scene.data.flags.hasOwnProperty("token-independence");
    const flagKeys = Object.keys(canvas.scene.data.flags["token-independence"])
    if (!isIndFlag || flagKeys.length === 0) {
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

    async function deleteActors(html, Arr = []) {
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
}

function addActors() {
    const sceneName = canvas.scene.data.name;
    const title = `Embed actor(s) to scene "${sceneName}"`;
    let content = ``;
    let buttons = {}

    let TokenArr = [];
    canvas.tokens.placeables.forEach(token => TokenArr.push(token.data.name));
    const actorArr = [... new Set(TokenArr)];

    if (actorArr.length === 0) {
        content = `There are no tokens placed in the scene.  Place a token for the actor(s) you wish to embed first!`;
        buttons = {Exit: {label: "Exit", callback: () => {dialog.close()}}};
    } else {
        content =   `<h2>Select actor(s) and Embed or Embed All</h2>
                    <div>
                        <table>`
        for (actor of actorArr) {
            content +=  `<tr>
                            <td style="width: 30px"><input type="checkbox" id="check" name="${actor}" value="${actor}"></td>
                            <td style="text-align: left"><label for="${actor}">${actor}</label>
                        </tr>`
        }
        content += `</table></div>`
        buttons = { Delete: {label: "Embed Selected", callback: (html) => {addActors(html)}},
                    DeleteAll: {label: "Embed All", callback: (html) => {addActors(html, actorArr)}}}
    }
    
    dialog.data.title = title;
    dialog.data.buttons = buttons;
    dialog.data.content = content;
    dialog.render(true);
    const dialogDOM = document.querySelector(`#${dialog.id}`);
    dialogDOM.style.height = "";
    dialog.position.height = null;

    async function addActors(html, Arr=[]) {
        if (Arr.length === 0) {
            const cbs = html.find('[id="check"]');  // array
            for (const cb of cbs) {
                if (cb.checked) {
                    Arr.push(cb.value);
                }
            }
        }
        for (const actorName of Arr) {
            const actor = game.actors.getName(actorName);
            const dupActor = duplicate(actor);
            delete dupActor["folder"];
            delete dupActor["sort"];
            await canvas.scene.setFlag("token-independence", actorName, dupActor);
            
            // This next line is to make this Token-Independence module compatible with the Token Mold module, which renames token.data.name, instead of just token.actorData.name
            canvas.tokens.updateAll(t => ({name: actor.name}), t => t.data.actorId === actor._id);
        }
    }

}

