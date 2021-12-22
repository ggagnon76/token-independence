let dialog;

/** Logic that defines if the conditions are met to render the button in the actor tab of the sidebar.
 *  Returns true if:
 *   - User is a GM, and one of;
 *      - There is at least 1 token in the scene AND at least 1 actor in the actors folder, OR
 *      - There is at least 1 actor embedded in flag data
 *  @return {Boolean}
 */
function isButton() {
    const isGM = game.user.isGM;
    const isTokenArr = canvas.tokens?.placeables.length;
    const isActors = game.actors.size;
    let isEmbedded = false;
    if (canvas.scene?.data.flags.hasOwnProperty("token-independence")) {
        isEmbedded = Object.keys(canvas.scene.data.flags["token-independence"]).length;
    }
    if (isGM && ((isTokenArr && isActors) || isEmbedded)) return true;

    return false;
}

/** This function will add the button to the actor sidebar when the conditions are correct,
 *  or it will remove the button when the conditions are no longer met.
 *  @return {void}
 */
export function toggleButton() {
    const isButtonAlready = $(".TI_Button").length;

    if ( isButton() ) {
        // If button is already there, exit the function
        if (isButtonAlready) return;
        // Add the button
        let buttonHTML = `<div class='header-actions action-buttons flexrow'><button class='TI_Button'>Token Independence</button>`;
        $("#actors .directory-header").append(buttonHTML);
        $(".TI_Button").click(createDialog)
    } else {
        // Remove the button, if it exists
        $(".TI_Button").remove();
    }
}

export function populateSynthetics() {
    const IndTokenArr = [];
    const TokenArr = canvas.tokens.placeables;
    for (const token of TokenArr) {
        if (!token.actor) IndTokenArr.push(token);
    }

    if (IndTokenArr.length === 0) return;

    for (const token of IndTokenArr) {
        const name = token.data.flags["token-independence"].ActorName;
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

/** Logic that defines if the conditions are met to enable the 'ADD' button in the Dialog Menu
 *  To return true, these conditions must be met:
 *    - There must be a token in the scene, AND
 *    - There must be an actor tied to that token in the actor sidebar, AND
 *    - The actor must not already be embedded in the scene
 *  @returns {boolean}
 */
function isAddButton() {
    // If there are no tokens in the scene, then
    if (!canvas.tokens.placeables.length) return false;

    // Gather an array of token names from tokens that reference existing actors in the sidebar
    const tokenArr = canvas.tokens.placeables.filter(t => t.actor !== null).map(n => n.name);

    // Gather an array of actor names already embedded in the scene
    let embeddedActorArr = [];
    if (canvas.scene.data.flags.hasOwnProperty("token-independence")) {
        embeddedActorArr = Object.keys(canvas.scene.data.flags["token-independence"]);
    }

    // Filter tokenArr to remove any actors already in embeddedActorArr
    const filteredTokenArr = tokenArr.filter(a => !embeddedActorArr.includes(a));

    // If there are tokens on the canvas for existing actors that are not already embedded, then
    if (filteredTokenArr.length) return true;

    // Otherwise, there are no tokens with existing actors that are not already embedded, so
    return false;
}

/** Logic that defines if the conditions are met to enable the 'REMOVE' button in the Dialog Menu
 *  To return true, these conditions must be met:
 *    - There must be an actor embedded in the scene
 *  @returns {boolean}
 */
function isRemoveButton () {
    // Gather an array of actor names already embedded in the scene
    let embeddedActorArr = [];
    if (canvas.scene.data.flags.hasOwnProperty("token-independence")) {
        embeddedActorArr = Object.keys(canvas.scene.data.flags["token-independence"]);
    }

    // If there is at least one, then
    if (embeddedActorArr.length) return true;

    // Otherwise, there are no actors embedded in the scene, so
    return false;
}

function createDialog() {
    const title = `Token-Independence Menu`;
    let content = ``;
    let buttons = {
       add: {label: "DISABLED.  Actors already embedded or no tokens in scene.", callback: () => {dialog.close()}},
       remove: {label: "DISABLED.  No embedded actors in scene.", callback: () => {dialog.close()}}
    };

    // Check if the conditions exist to be allowed to embed actors into the scene flags
    if ( isAddButton() ) {
        buttons.add = {label: "Embed actor(s) into scene", callback: () => {addActorDialog()}}
    } 

    // Check if the conditions exist to be allowed to remove embedded actors from scene flags
    if ( isRemoveButton() ) {
        buttons.remove = {label: "Remove embedded actor(s) from scene", callback: () => {removeActors()}}
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

    toggleButton();
}

async function removeActors() {
    
    const removeActorData = {
        actors: Object.keys(canvas.scene.data.flags["token-independence"])
    }

    const sceneName = canvas.scene.data.name;
    const title = `Remove embedded actors from scene "${sceneName}"`;
    const buttons = { 
        Delete: {label: "Remove Selected", callback: (html) => {deleteActors(html)}},
        DeleteAll: {label: "Remove All", callback: (html) => {deleteActors(html, removeActorData.actors)}}
    };
    const content = await renderInner("./modules/token-independence/templates/removeActor.hbs", removeActorData);
    
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
    if ((sceneSize + actorSizeSum) > 1000000) {  // Arbitrary limit imposed to satisfy Foundry Staff.
        return Dialog.prompt({
            title: "FLAG DATA ALLOTMENT EXCEEDED!!",
            content: `  <div>The selected actors chosen to be embedded would have exceeded the 1mb allotment for actor flag data imposed by this module.</br></div>
                        <h2></h2>
                        <h2>BE AWARE THAT NO ACTORS HAVE BEEN EMBEDDED.</h2>
                        <div>DELETING ACTORS WILL CAUSE ALL PLACED TOKENS OF THAT ACTOR TO BECOME BROKEN!!</div>`,
            label: "Return to Embed Dialog",
            callback: () => {addActorDialog()}
        });
    }
    for (const actor of Arr) {
        await canvas.scene.setFlag("token-independence", actor.name, dupActor(actor.name));
    }
}

async function addActorDialog() {
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
        const actorName = token.data.flags["token-independence"].ActorName;
        const isActor = game.actors.filter(a => a.name === actorName).length > 0 ? true : false;
        if (isActor) TokenArr.push(actorName)
    });
    let actorArr = [... new Set(TokenArr)];

    if (canvas.scene.data.flags.hasOwnProperty("token-independence")) {
        sceneActors = Object.keys(canvas.scene.data.flags["token-independence"]);
    }
    actorArr = actorArr.filter(o => sceneActors.indexOf(o) === -1);

    const addActorData = {
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
        buttons = { 
            Embed: {label: "Embed Selected", callback: (html) => {addActors(html, addActorData.sceneSize)}},
            EmbedAll: {label: "Embed All", callback: (html) => {addActors(html, addActorData.sceneSize, addActorData.actorArray)}}
        };
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