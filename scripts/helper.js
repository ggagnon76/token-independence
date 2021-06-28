let dialog;

export function populateSynthetics() {
    const IndTokenArr = [];
    const TokenArr = canvas.tokens.placeables;
    for (const token of TokenArr) {
        if (!token.actor) IndTokenArr.push(token);
    }

    if (IndTokenArr.length === 0) return;

    for (const token of IndTokenArr) {
        const name = token.data.name;
        let embeddedActor = canvas.scene.data.flags["token-independence"][name];
        if (!embeddedActor) {
            ui.notifications.info(`${name} token(s) is/are broken.  To fix it, choose "Reattach Actor to Token(s)" in the menu.`);
            continue;
        }

        const cls = getDocumentClass("Actor");
        const tokenActor = new cls(embeddedActor, {parent: token.document});
        const overrideData = foundry.utils.mergeObject(tokenActor.toJSON(), token.data.actorData);
        const derivedActor = new cls(overrideData, {parent: token.document});
        token.document._actor = derivedActor;
        game.actors.tokens[token.id] = derivedActor;
    }
}

export function createDialog() {
    const title = `Token-Independence Menu`;
    let content = ``;
    let buttons = {};
    let tokenArr = canvas.tokens.placeables.filter(t => t.actor !== null).map(n => n.name);
    let sceneActors = [];

    // logic to enable or disable button to add actors to scene
    if (canvas.scene.data.flags.hasOwnProperty("token-independence")) {
        sceneActors = Object.keys(canvas.scene.data.flags["token-independence"]);
    }
    tokenArr = tokenArr.filter(o => sceneActors.indexOf(o) === -1);
    buttons.add = {label: "DISABLED.  Actors already embedded or no tokens in scene.", callback: () => {dialog.close()}}
    if (tokenArr.length > 0) {
        buttons.add = {label: "Embed actor(s) into scene", callback: () => {addActorDialog()}}
    } 

    // logic to enable or disable button to remove embedded actors from scene
    const isIndFlag = canvas.scene.data.flags.hasOwnProperty("token-independence");
    buttons.remove = {label: "DISABLED.  No embedded actors in scene.", callback: () => {dialog.close()}};
    if (isIndFlag) {
        const flagKeys = Object.keys(canvas.scene.data.flags["token-independence"]);
        if (flagKeys.length > 0) {
            buttons.remove = {label: "Remove embedded actor(s) from scene", callback: () => {removeActors()}}
        } 
    }
    
    // logic to enable or disable button to reattach tokens to actors in actor folder.
    tokenArr = canvas.tokens.placeables.filter(t => t.actor === null);
    const actorArr = game.actors.filter(a => a.name !== null);
    buttons.reattach = {label: "DISABLED. No broken tokens, or actors in folder to link.", callback: () => {dialog.close()}};
    if (tokenArr.length > 0 && actorArr.length > 0) {
        buttons.reattach = {label: "Reattach Actor to Token(s)", callback: () => {attachActors()}};
    } 

    // launch dialog window.
    dialog = new Dialog({title, content, buttons}, {id: "TIoptionButtons"}).render(true);
}

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

function removeActors() {
    const sceneName = canvas.scene.data.name;
    const title = `Remove embedded actors from scene "${sceneName}"`;
    let content = ``;

    const keys = Object.keys(canvas.scene.data.flags["token-independence"]);
    content =   `<h2>Select actors and Remove or Remove All</h2>
                <div>
                    <table>`
    for (const actor of keys) {
        content +=  `<tr>
                        <td style="width: 30px"><input type="checkbox" id="check" name="${actor}" value="${actor}"></td>
                        <td style="text-align: left"><label for="${actor}">${actor}</label>
                    </tr>`
    }
    content += `</table></div>`

    const buttons = { Delete: {label: "Remove Selected", callback: (html) => {deleteActors(html)}},
                DeleteAll: {label: "Remove All", callback: (html) => {deleteActors(html, keys)}}}
   
    dialog = new Dialog({title, content, buttons}).render(true);
}

async function addActors(html, sceneSize, Arr=[]) {
    if (Arr.length === 0) {
        const cbs = html.find('[id="check"]');  // array
        for (const cb of cbs) {
            if (cb.checked) {
                Arr.push({name: cb.value});
            }
        }
    }
    if (Arr.length === 0) {
        ui.notifications.error("You did not select any actors to embed!");
        return
    }
    let actorSizeSum = 0; 
    for (const actor of Arr) {
        actorSizeSum += estimateBytes(dupActor(actor.name));
    }
    if ((sceneSize + actorSizeSum) > 1000000) {
        return addActorDialog('<h1 style="color: red">The selected actors exceeded the 1mb limit!</h1>')
    }
    for (const actor of Arr) {
        await canvas.scene.setFlag("token-independence", actor.name, dupActor(actor.name));
    }
}

async function addActorDialog(preContent = ``) {
    const sceneName = canvas.scene.data.name;
    const tokenSize = estimateBytes(canvas.scene.data.tokens);
    let flagSize = 0;
    if (canvas.scene.data.flags.hasOwnProperty("token-independence")) {
        flagSize += estimateBytes(canvas.scene.data.flags["token-independence"]);
    }
    const allFlagSize = estimateBytes(canvas.scene.data.flags);

    const title = `Embed actor(s) to scene "${sceneName}"`;
    let content = `There are no tokens placed in the scene.  Place a token for the actor(s) you wish to embed first!`;
    let buttons = {Exit: {label: "Exit", callback: () => {dialog.close()}}};
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

    const addActorData = {
        preContent: preContent,
        TISize: tokenSize + flagSize,
        otherFlags: allFlagSize - flagSize,
        sceneSize: estimateBytes(canvas.scene),
        drawingSize: estimateBytes(canvas.scene.data.drawings),
        lightSize: estimateBytes(canvas.scene.data.lights),
        noteSize: estimateBytes(canvas.scene.data.notes),
        soundSize: estimateBytes(canvas.scene.data.sounds),
        templateSize: estimateBytes(canvas.scene.data.templates),
        tileSize: estimateBytes(canvas.scene.data.tiles),
        wallSize: estimateBytes(canvas.scene.data.walls),
        actorSizeSum: 0,
        actorArray: []
    }

    if (actorArr.length !== 0) {
        for (const actor of actorArr) {
            const actorObj = {
                name: actor,
                size: estimateBytes(dupActor(actor))
            }
            addActorData.actorArray.push(actorObj)
            addActorData.actorSizeSum += estimateBytes(dupActor(actor));
        }
        content = await renderInner("./modules/token-independence/templates/AddActor.hbs", addActorData);
        buttons = { Embed: {label: "Embed Selected", callback: (html) => {addActors(html, addActorData.sceneSize)}},
                    EmbedAll: {label: "Embed All", callback: (html) => {addActors(html, addActorData.sceneSize, addActorData.actorArray)}}}
    }
    
    dialog = new Dialog({title, content, buttons}).render(true);
}

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
            "actorId": actor.id
        }
        updates.push(obj)
    }
    await canvas.scene.updateEmbeddedDocuments("Token", updates);
}

async function attachActors() {
    const sceneName = canvas.scene.data.name;
    const title = `Attach actor from Actors folder to Token(s) in "${sceneName}"`;
    let buttons = {}

    const attachActorData = {
        tokens: []
    }

    const TokenArr = canvas.tokens.placeables;
    for (const token of TokenArr) {
        if (!token.actor) {
            const actorData = {
                name: token.data.name,
                id: token.id,
                tokenName: token.data.actorData.name
            }
            attachActorData.tokens.push(actorData);
        }
    }


    const content = await renderInner("./modules/token-independence/templates/AttachActor.hbs", attachActorData);
    buttons =   { 
                    Attach: {label: "Attach Actor", callback: (html) => {attachActor(html)}},
                    Quit: {label: "Exit", callback: () => {dialog.close()}}
                }

    dialog = new Dialog({title, content, buttons}).render(true);
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

async function renderInner(path, data) {
    let html = await renderTemplate(path, data);
    if ( html === "" ) throw new Error(`No data was returned from template ${path}`);
    return html;
}