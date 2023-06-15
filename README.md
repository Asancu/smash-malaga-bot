# My version of smash-malaga-bot
This version is pretty much the same as the original. It reduces displayed text and images and restructures users to manage lists in a different way.

# Command list

- `/start` This will make the bot introduce itself.
- `/proximaQuedada [weekdays]` This will generate the participant list for each possible day people are able to attend (admins-only command).
- `/apuntame [weekdays]` The user that typed this command will join specific participant list (passing weekdays separated by spaces).
- `/apuntarSeta [weekdays]` Users will be updated in the list with a mushroom right next to their username to point out they will bring their own console. If users didn't join a list previously via the /apuntame command they will be in automatically (passing weekdays separated by spaces).
- `/quitame [weekdays]` Deletes the user from any participant list (passing weekdays separated by spaces).
- `/quitarSeta [weekdays]` Just like /apuntarSeta this command will remove the console identifier from users nickname (passing weekdays separated by spaces).
- `/cambiarNick 'new-name'` Users can change their displayed nick in all lists by using this command.
- `/ruleset` This generates an image with the official ruleset and stages for Smash Málaga.
- `/fullruleset` To be used right after typing `ruleset` in. This will explain the procedure to play a set in tournaments.
