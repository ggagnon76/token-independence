[![GitHub downloads (latest)](https://img.shields.io/badge/dynamic/json?label=Downloads@latest&query=assets[?(@.name.includes('zip'))].download_count&url=https://api.github.com/repos/ggagnon76/token-independence/releases/latest&color=green)](https://github.com/ggagnon76/token-independence/releases/latest)
# Token-Independence
Allow tokens to live and work in scenes free of their actor overlords!

WARNING: This module is very much an ALPHA and has barely had any testing.  If using this module causes loss of data or corrupts a world, you have been warned.

See the Proof of Concept in action:
[![Watch the video](https://img.youtube.com/vi/40zC-dGjw-s/maxresdefault.jpg)](https://youtu.be/40zC-dGjw-s)

This module allows a GM to populate a scene with tokens from actors, then delete the actors from the actors folder (to keep things tidy).  The module will populate the scene flags with the bare minimum data to create synthetic actors for tokens with "null" actor data.

The populated scenes can be stored in a compendium and pulled out for use at any time, without having to worry about keeping actors in the actor folder.  The synthetic actor that is created is a full actor, so this module **SHOULD** work with high-automation worlds.  Unfortunately, I run no-automation games, so this is completely untested.

This module, at this release,  **SHOULD** be system agnostic.  Any modules that monkeypatch actor creation functions/methods or the core actor object will probably not work correctly.

The data stored in the scene is a fraction of what actors in the actors folder contain, so this module should reduce the data uploaded to clients.  However, if the same actor/creature is embedded in several scenes, which are all in the scenes folder, then those gains could become losses, ie: you'll upload more data than just having the actor in the actors folder in the first place.  Keep your scenes folder tidy too, store what you don't immediately need in a compendium, and you **SHOULD** see improvements in upload performance.  I say 'should' because this has not been verified.  At all. It's just theory.

Once the actor is deleted, it cannot be modified (in this version).  In other words, you can't give ownership of the actor to a player once it is embedded in a scene.  You have to give your player ownership (or any other UI manipulation of the actor) and THEN delete the actor.

GENERAL WORKFLOW:
1) Populate a scene with tokens, from one or many actor(s) in the actors folder.
2) If the actor isn't in a compendium, and you don't want to lose that actor, copy it to a compendium.
3) While the scene is active and viewed, and while this module is activated, delete the actor from the actors folder to embed the actor data into the scene.
4) Do what you want with the scene and you're able to view character sheets from these tokens.  Anyone with the Token Independence module will be able to run the tokens on that scene.
5) Feel free to delete tokens from a scene.  The embedded data will not be deleted from the scene until the last token for any given actor is deleted.
6) Tokens can be copy-pasted to the same scene and they will work, as long as there is one token on the scene at all times.  If you copy a token, delete the last one, then paste, it won't work.

WHAT THIS IS NOT FOR OR DOESN'T DO:
- Not for actors that should be linked, like your players' characters.  A deleted actor is deleted.  Save your stuff in compendiums!
- If you name your actor BOB and copy BOB into another scene, changes you make to BOB in scene A will not be reflected on BOB in scene B.
- You can not cut and paste an 'independant' token from one scene to another blank scene.  Once pasted to another scene, it becomes a broken token.

Bug reporting has been activated for this module.  See their readme here:  https://github.com/League-of-Foundry-Developers/bug-reporter/blob/master/README.md

