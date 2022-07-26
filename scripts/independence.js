import { populateSynthetics, toggleButton } from './helper.js';


Hooks.on('canvasReady', () =>  {
    
    // Following will add or remove the button to/from the actor sidebar
    toggleButton();
    // The following function creates a synthetic actor using an embedded actor data and adds it to the collection(?)
    populateSynthetics();
    
})

Hooks.on('pasteToken', populateSynthetics);

Hooks.on('createToken', (tokenDoc) => {
    const actor = game.actors.get(tokenDoc.actorId);
    tokenDoc.setFlag("token-independence", "ActorName", actor.name)
    // Following will add or remove the button to/from the actor sidebar
    toggleButton();
})

// Following will add or remove the button to/from the actor sidebar
Hooks.on('deleteToken', toggleButton);

// If a 'misbehaving' module re-renders the sidebar, add or remove the button to/from the actor sidebar
Hooks.on("renderSidebarTab", toggleButton);