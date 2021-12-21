import { populateSynthetics, toggleButton } from './helper.js';


Hooks.on('canvasReady', () =>  {
    
    // Following will add or remove the button to/from the actor sidebar
    toggleButton();
    // The following function creates a synthetic actor using an embedded actor data and adds it to the collection(?)
    populateSynthetics();
    
})

Hooks.on('pasteToken', populateSynthetics);

Hooks.on('createToken', (tokenDoc) => {
    const actorID = tokenDoc.actor.data._id;
    const actor = game.actors.get(actorID);
    // This next line is to make this Token-Independence module compatible with the Token Mold module, which renames token.data.name, instead of just token.actorData.name
    canvas.tokens.updateAll(t => ({name: actor.name}), t => t.data.actorId === actor.id);
    // Following will add or remove the button to/from the actor sidebar
    toggleButton();
})

// Following will add or remove the button to/from the actor sidebar
Hooks.on('deleteToken', toggleButton);
