import { populateSynthetics, createDialog } from './helper.js';

// Add a button to the actor Sidebar, that when clicked will render a Dialog with options.
Hooks.on("renderSidebarTab", async (app, html) => {
    // This script is only for a GM
    if(game.user.isGM) {
        // Only render on Actors tab
        if (app.options.id == "actors") {
            const TokenArr = canvas?.tokens?.placeables;
            // Only render the button if there are tokens in a scene
            if (TokenArr === undefined || TokenArr.length === 0) return
            // Create a button that will launch the dialog menu when clicked.  Insert the button before the search field on the Actor tab.
            let button = $("<div class='header-actions action-buttons flexrow'><button class='ddb-import'>Token Independence</button>")
            button.click(function () { createDialog(); });
            html.find("div.header-search.flexrow").before(button);
        }
    }
})

Hooks.on('canvasReady', () =>  {
    
    // Following will trigger the "renderSidebarTab" hook, and our logic to display the menu button (or not)
    ui.sidebar.render(true);
    // The following function creates a synthetic actor using an embedded actor data and adds it to the collection(?)
    populateSynthetics();
    
})

Hooks.on('pasteToken', populateSynthetics);

Hooks.on('createToken', (tokenDoc) => {
    const actorID = tokenDoc.actor.data._id;
    const actor = game.actors.get(actorID);
    // This next line is to make this Token-Independence module compatible with the Token Mold module, which renames token.data.name, instead of just token.actorData.name
    canvas.tokens.updateAll(t => ({name: actor.name}), t => t.data.actorId === actor.id);
    // Following will trigger the "renderSidebarTab" hook, and our logic to display the menu button (or not)
    ui.sidebar.render(true);
})

// Following will trigger the "renderSidebarTab" hook, and our logic to display the menu button (or not)
Hooks.on('deleteToken', () => ui.sidebar.render(true));