# Battlesnake AI Using A* algorithm through time
This project contains an AI for battlesnake [https://play.battlesnake.com/](https://play.battlesnake.com). What sets the AI which we've developed apart is that we incorporate a time dimension into the A* algorithm. Instead of generating paths on a 2d grid, the A* algorithm instead traverses through a third dimension 'time'. This enables the snake to know where itself and friendly snakes are going to be at each specific point in time, and allows the snake to plan a path through time. This is all possible due to the turn-based nature of the game.

# example game
![battlesnake_game](https://github.com/LuukEbenau/battlesnake-algorithm-through-time/assets/45255779/0f2d2469-d27a-4988-88c0-c44c7cbe4af0)



[![Run on Replit](https://repl.it/badge/github/BattlesnakeOfficial/starter-snake-typescript)](https://replit.com/@Battlesnake/starter-snake-typescript)

## Technologies Used

This project uses [TypeScript](https://www.typescriptlang.org/), [Node.js](https://nodejs.org/en/), and [Express](https://expressjs.com/). It also comes with an optional [Dockerfile](https://docs.docker.com/engine/reference/builder/) to help with deployment.

## Run Your Battlesnake

Install dependencies using npm

```sh
npm install
```

Start your Battlesnake

```sh
npm run start
```

You should see the following output once it is running

```sh
Running Battlesnake at http://0.0.0.0:8000
```

Open [localhost:8000](http://localhost:8000) in your browser and you should see

```json
{"apiversion":"1","author":"","color":"#888888","head":"default","tail":"default"}
```

## Play a Game Locally

Install the [Battlesnake CLI](https://github.com/BattlesnakeOfficial/rules/tree/main/cli)
* You can [download compiled binaries here](https://github.com/BattlesnakeOfficial/rules/releases)
* or [install as a go package](https://github.com/BattlesnakeOfficial/rules/tree/main/cli#installation) (requires Go 1.18 or higher)

Command to run a local game

```sh
battlesnake play -W 11 -H 11 --name 'TypeScript Starter Project' --url http://localhost:8000 -g solo --browser
```
Or run as team with
```
npm run start
npm rum start1
battlesnake play -W 20 -H 20 --browser --name Luuk --url http://localhost:8000 --name Adrian --url http://localhost:8000  --name Noob1 --url http://localhost:8001 --name Noob2 --url http://localhost:8001
```


## Next Steps

Continue with the [Battlesnake Quickstart Guide](https://docs.battlesnake.com/quickstart) to customize and improve your Battlesnake's behavior.

**Note:** To play games on [play.battlesnake.com](https://play.battlesnake.com) you'll need to deploy your Battlesnake to a live web server OR use a port forwarding tool like [ngrok](https://ngrok.com/) to access your server locally.
