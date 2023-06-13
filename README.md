# smash-malaga-bot
A bot written in TypeScript for Telegram created just for local gaming meet-ups and some other stuff.

To activate this bot locally, simply type `npx ts-node botTelegram.ts` from the project root.

# Command list

- `/start` This will make the bot introduce themself.
- `/proximaquedada` This will generate the participant list for the next meet-up.
- `/apuntame` The user that typed this command will join the participant list.
- `/aportarSeta` Recommended to use just right after `/apuntame`. Users will be included in a new list with a mushroom right next to their username to point out they will bring their own console.
- `/quitame` Erases the user from the actual participant list.
- `/ruleset` This generates an image with the official ruleset and stages for Smash Málaga.
- `/fullruleset` To be used right after typing `ruleset` in. This will explain the procedure to play a set in tournaments.
