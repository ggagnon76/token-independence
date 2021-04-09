Hooks.on('canvasReady', () =>  {
    
    // Following is needed to render the menu button if tokens are present in a scene.  See Hooks.on("renderSidebarTab")
    ui.sidebar.render(true);

    const IndTokenArr = [];
    const TokenArr = canvas.tokens.placeables;
    for (const token of TokenArr) {
        if (!token.actor) IndTokenArr.push(token);
    }

    if (IndTokenArr.length === 0) return;

    for (const token of IndTokenArr) {
        const name = token.data.name;
        const freedomFighterObj = canvas.scene.data.flags["token-independence"][name];
        if (!freedomFighterObj) {
            ui.notifications.info(`${name} token(s) is/are broken.  To fix it, choose "Reattach Actor to Token(s)" in the menu.`);
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

Hooks.on('createToken', (scene, token) => {
    const actorID = token.actorId;
    const actor = game.actors.get(actorID);
    // The following is required to stop console errors resulting from phantom tokens created by the Multi Level Tokens module.
    if (!actor) return
    // This next line is to make this Token-Independence module compatible with the Token Mold module, which renames token.data.name, instead of just token.actorData.name
    canvas.tokens.updateAll(t => ({name: actor.name}), t => t.data.actorId === actor._id);
    ui.sidebar.render(true);
})

Hooks.on('deleteToken', () => {
    ui.sidebar.render(true);
})

Hooks.on('deleteActor', () => {
    canvas.draw();
})

Hooks.on('createActor', () => {
    canvas.draw();
})

// Add a button to the actor Sidebar, that when clicked will render a Dialog with options.
Hooks.on("renderSidebarTab", async (app, html) => {
    // This script is only for a GM
    if(game.user.isGM) {
        // Only render on Actors tab
        if (app.options.id == "actors") {
            const TokenArr = canvas.tokens.placeables;
            // Only render the button if there are tokens in a scene
            if (TokenArr.length === 0) return
            // Create a button that when clicked, will launch the dialog menu.  Insert the button before the search field on the Actor tab.
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
    let content = `<style>#TIoptionButtons .dialog-buttons {flex-direction: column;}</style>`;
    let buttons = {};
    let tokenArr = canvas.tokens.placeables.filter(t => t.actor !== null).map(n => n.name);
    let sceneActors = [];
    if (canvas.scene.data.flags.hasOwnProperty("token-independence")) {
        sceneActors = Object.keys(canvas.scene.data.flags["token-independence"]);
    }
    tokenArr = tokenArr.filter(o => sceneActors.indexOf(o) === -1);
    if (tokenArr.length > 0) {
        buttons.add = {label: "Embed actor(s) into scene", callback: () => {addActorDialog()}}
    } else {
        content += `<p>There must be an actor in the Actor's folder with a token in the scene to be able to embed.</p>`
    }
    const isIndFlag = canvas.scene.data.flags.hasOwnProperty("token-independence");
    if (isIndFlag) {
        const flagKeys = Object.keys(canvas.scene.data.flags["token-independence"]);
        if (flagKeys.length > 0) {
            buttons.remove = {label: "Remove embedded actor(s) from scene", callback: () => {removeActors()}}
        } else {
            content += `<p>There must be embedded actors in the scene to be able to remove them.</p>`
        }
    } else {
        content += `<p>There must be embedded actors in the scene to be able to remove them.</p>`
    }
    tokenArr = canvas.tokens.placeables.filter(t => t.actor === null);
    const actorArr = game.actors.filter(a => a.name !== null);
    if (tokenArr.length > 0 && actorArr.length > 0) {
        buttons.reattach = {label: "Reattach Actor to Token(s)", callback: () => {attachActors()}};
    } else {
        content += `<p>There have to be broken tokens and actors in the Actor's folder to be able to reattach.</p>`
    }
    dialog = new Dialog({title, content, buttons}, {id: "TIoptionButtons"}).render(true);
}

function removeActors() {
    const sceneName = canvas.scene.data.name;
    const title = `Remove embedded actors from scene "${sceneName}"`;
    let content = ``;

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

    const buttons = { Delete: {label: "Remove Selected", callback: (html) => {deleteActors(html)}},
                DeleteAll: {label: "Remove All", callback: (html) => {deleteActors(html, keys)}}}
    dialog.data.title = title;
    dialog.data.buttons = buttons;
    dialog.data.content = content;
    dialog.render(true);
    const dialogDOM = document.querySelector(`#${dialog.id}`);
    dialogDOM.style.height = "";
    dialog.position.height = null;
    canvas.draw();

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

function addActorDialog(preContent = ``) {
    const sceneName = canvas.scene.data.name;
    const sceneSize = estimateBytes(canvas.scene);
    const tokenSize = estimateBytes(canvas.scene.data.tokens);
    const drawingSize = estimateBytes(canvas.scene.data.drawings);
    const allFlagSize = estimateBytes(canvas.scene.data.flags);
    const lightSize = estimateBytes(canvas.scene.data.lights);
    const noteSize = estimateBytes(canvas.scene.data.notes);
    const soundSize = estimateBytes(canvas.scene.data.sounds);
    const templateSize = estimateBytes(canvas.scene.data.templates);
    const tileSize = estimateBytes(canvas.scene.data.tiles);
    const wallSize = estimateBytes(canvas.scene.data.walls);
    let flagSize = 0;
    if (canvas.scene.data.flags.hasOwnProperty("token-independence")) {
        flagSize = estimateBytes(canvas.scene.data.flags["token-independence"]);
    } 
    const title = `Embed actor(s) to scene "${sceneName}"`;
    let content = preContent;
    let buttons = {};
    let sceneActors = [];
    let TokenArr = [];
    
    canvas.tokens.placeables.forEach(token => {
        const isActor = game.actors.filter(a => a.name === token.data.name).length > 0 ? true : false;
        if (isActor) TokenArr.push(token.data.name)
    });
    let actorArr = [... new Set(TokenArr)];

    if (canvas.scene.data.flags.hasOwnProperty("token-independence")) {
        sceneActors = Object.keys(canvas.scene.data.flags["token-independence"]);
    }
    actorArr = actorArr.filter(o => sceneActors.indexOf(o) === -1);

    if (actorArr.length === 0) {
        content = `There are no tokens placed in the scene.  Place a token for the actor(s) you wish to embed first!`;
        buttons = {Exit: {label: "Exit", callback: () => {dialog.close()}}};
    } else {
        content +=   `   <p>The following are estimates of the database string size for the following components, in bytes:
                        <li style="color: blue">Tokens + embedded actors: ${tokenSize + flagSize} bytes.</li>
                        <li>All other flags: ${allFlagSize - flagSize} bytes.</li>
                        <li>Drawings: ${drawingSize} bytes.</li>
                        <li>Lights: ${lightSize} bytes.</li>
                        <li>Notes: ${noteSize} bytes.</li>
                        <li>Sounds: ${soundSize} bytes.</li>
                        <li>Templates: ${templateSize} bytes.</li>
                        <li>Tiles: ${tileSize} bytes.</li>
                        <li>Walls: ${wallSize} bytes.</li>
                        <h2> </h2>
                        <li style="color: blue">Total Scene size: ${sceneSize} bytes.</li>
                        <h2 style="padding: 10px">Token Independence will not allow more than 1mb of data for tokens and embedded actors in a scene!</h2>
                        <h2 style="padding: 10px">Select actor(s) and Embed or...</h2>
                    
                    <div>
                        <table>`
        let actorSizeSum = 0;
        for (actor of actorArr) {
            const actorSize = estimateBytes(dupActor(actor));
            actorSizeSum += actorSize;
            content +=  `<tr>
                            <td style="width: 30px"><input type="checkbox" id="check" name="${actor}" value="${actor}"></td>
                            <td style="width: 200px text-align: left"><label for="${actor}">${actor}</label>
                            <td style="text-align: left">(${actorSize} bytes)
                        </tr>`
        }
        content += `    </table>
                    <h2 style="padding: 10px">...Embed All (${actorSizeSum} bytes.)</h2>
                    </div>`
        buttons = { Delete: {label: "Embed Selected", callback: (html) => {addActors(html, sceneSize)}},
                    DeleteAll: {label: "Embed All", callback: (html) => {addActors(html, sceneSize, actorArr)}}}
    }
    
    dialog.data.title = title;
    dialog.data.buttons = buttons;
    dialog.data.content = content;
    dialog.render(true);
    const dialogDOM = document.querySelector(`#${dialog.id}`);
    dialogDOM.style.height = "";
    dialog.position.height = null;
    canvas.draw();

    async function addActors(html, sceneSize, Arr=[]) {
        if (Arr.length === 0) {
            const cbs = html.find('[id="check"]');  // array
            for (const cb of cbs) {
                if (cb.checked) {
                    Arr.push(cb.value);
                }
            }
        }
        if (Arr.length === 0) {
            ui.notifications.error("You did not select any actors to embed!");
            return
        }
        let actorSizeSum = 0; 
        for (const actorName of Arr) {
            actorSizeSum += estimateBytes(dupActor(actorName));
        }
        if ((sceneSize + actorSizeSum) > 1000000) {
            return addActorDialog('<h1 style="color: red">The selected actors exceeded the 1mb limit!</h1>')
        }
        for (const actorName of Arr) {
            await canvas.scene.setFlag("token-independence", actorName, dupActor(actorName));
        }
    }

}

function attachActors() {
    const sceneName = canvas.scene.data.name;
    const title = `Attach actor from Actors folder to Token(s) in "${sceneName}"`;
    let content = ``;
    let buttons = {}

    const IndTokenArr = [];
    const TokenArr = canvas.tokens.placeables;
    for (const token of TokenArr) {
        if (!token.actor) IndTokenArr.push(token);
    }

    content =   `   <h1>Assign one actor at a time to one or multiple tokens.</h1>
                    <h2><p>If there is nothing special about your token, then just replace it with a token dragged to the canvas from an actor.</p>
                    <p>Only resort to this if your token has unique values you wish to preserve!</p></h2>
                    <div>
                        <table>
                            <tr>
                                <td style="width: 200px"><label for="attachActor">Actor must be in Actor's folder... Type actor name here: </label></td>
                                <td style="text-align: left"><input type="text" id="attachActor" name="attachActor" style="width: 200px"></td>
                            </tr>
                        </table>
                        <table>`
    for (const token of IndTokenArr) {
        content +=  `<tr>
                        <td style="width: 30px"><input type="checkbox" id="check" name="${token.data.name}" value="${token.id}"></td>
                        <td style="text-align: left"><label for="${token.data.name}">${token.data.name} (${token.data.actorData.name})</label>
                    </tr>`
    }
    content += `</table></div>`
    buttons = { Attach: {label: "Attach Actor", callback: (html) => {attachActor(html); canvas.draw()}},
                Quit: {label: "Exit", callback: () => {dialog.close()}}
            }
    dialog.data.title = title;
    dialog.data.buttons = buttons;
    dialog.data.content = content;
    dialog.render(true);
    const dialogDOM = document.querySelector(`#${dialog.id}`);
    dialogDOM.style.height = "";
    dialog.position.height = null;

    async function attachActor(html) {
        const actorName = html.find('[name="attachActor"]').val();
        if (actorName === "") {
            ui.notifications.error("You did not enter the name of the actor to attach to!");
            return
        }
        const actor = game.actors.getName(actorName);
        if (!actor) {
            ui.notifications.error("There is no actor by that name in the Actor's Folder!");
            return
        }
        const tokenArr = [];
        const cbs = html.find('[id="check"]');  // array
        for (const cb of cbs) {
            if (cb.checked) {
                tokenArr.push(cb.value);
            }
        }
        if (tokenArr.length === 0) {
            ui.notifications.error("You did not select any tokens to attach the actor to!");
            return
        }
        const updates = [];
        for (const token of tokenArr) {
            const tok = canvas.tokens.placeables.find(t => t.id === token);
            const obj = {
                "_id": tok.data._id,
                "actorId": actor._id
            }
            updates.push(obj)
        }
        await canvas.tokens.updateMany(updates);
    }
}

function estimateBytes (entity) {
    const entityDup = entity;
    const sceneString = JSON.stringify(entityDup);
    return (new TextEncoder().encode(sceneString)).length;
}

function dupActor (actorName) {
    const actor = game.actors.getName(actorName);
    const dupActor = duplicate(actor);
    delete dupActor["folder"];
    delete dupActor["sort"];
    return dupActor
}
