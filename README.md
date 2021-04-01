[![GitHub downloads (latest)](https://img.shields.io/badge/dynamic/json?label=Downloads@latest&query=assets[?(@.name.includes('zip'))].download_count&url=https://api.github.com/repos/ggagnon76/token-independence/releases/latest&color=green)](https://github.com/ggagnon76/token-independence/releases/latest)
# Token-Independence
Allow tokens to live and fully function in scenes, free of their actor overlords!

See the Proof of Concept in action:
[![Watch the video](https://img.youtube.com/vi/40zC-dGjw-s/maxresdefault.jpg)](https://youtu.be/40zC-dGjw-s)

This module allows a GM to populate a scene with tokens from actors and then embed the bare minimum actor data into the scene flags, allowing the module to recreate synthetic actors to implement full functionality.

The populated scenes can be exported, imported, stored in a compendium and pulled out for use at any time, without having to worry about keeping actors in the actor folder.  You can conceivably do all your prep in a test/prep world, export your finished scene, switch to your game world, import your finished scene and run your game without a single creature in the actor folder.

Content creators that are interested in creating encounters with their homebrew or SRD creatures can fully populate a scene with tokens, allowing a GM to purchase, install and run it immediately upon installation!

Version 0.1.0 of this module is built around D&D5e.  If this module is widely adopted and other gaming systems want to build upon it, they may fork the repository on GitHub per the MIT license, or make pull requests.

If for some reason you wish to give ownership of a token to a player, you can import the correct actor into the actor's folder, then use an option in the module's menu to attach the actor to the token.  Once this has been completed, you can assign the actor to the player per usual core functionality.

Should the need arise, it is possible to remove the actor data from the scene flags via the provided menu.

THEORY:
The data stored in the scene doesn't contain the entire structure of an actor in the actors folder, so this module should reduce the data uploaded to clients.  However, if the same actor/creature is embedded in several scenes, which are all in the scenes folder, then those gains could become losses, ie: you'll upload more data than just having the actor in the actors folder in the first place.  Keep your scenes folder tidy too, store what you don't immediately need in a compendium, and you **SHOULD** see improvements in upload performance.  I say 'should' because this has not been verified.  At all. It's just theory.





