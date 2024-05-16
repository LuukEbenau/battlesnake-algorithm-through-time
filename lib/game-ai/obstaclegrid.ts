import { stat } from "fs";
import { Battlesnake, Coord, GameState } from "../../types";
import { LOGLEVEL, loglevel } from "../config";
import { Vector2Int } from "../util/vectors";
import { TeamCommunicator } from "./team-communicator";
import * as fs from 'fs';

export class ObstacleGrid{
    private readonly snakeBodyPenalty = 20000 // some high number, as long as its >10000 it should be fine
    private readonly friendlySnakePathCollisionPenalty = 200;
    private readonly snakeOppositionPenalty = 100
    private readonly potentialEnemyPositionCoefficientAmplifier = 15; // probably lower?

    public width = 0;
    public height = 0;
    private grid: number[][][];

    public constructor(public state: GameState, public teamCommunicator: TeamCommunicator) {
        this.width = 0
        this.height = 0;
        this.grid = [];
    }

    /**
     * Get the grid at a certain timestep. If the grid at that timestep doesnt already exist, create and calculate the grid for the time step
     * @param t
     * @returns
     */
    public getGridAtTime(t: number):number[][]{
        let currentGridSize = this.grid.length;
        if(t>=currentGridSize){
            // add extra layers, in case it doesnt exist yet
            for(let i = currentGridSize; i <= t; i++){
                this.grid[i] = this.createGridLayer(i,this.width, this.height, this.state?.board.snakes as Battlesnake[])
            }

            if(t == 1 && loglevel <= LOGLEVEL.DEBUG){
                this.writeToFile(t);
            }
        }

        return this.grid[t];
    }

    public createInitialGrid(width:number, height:number, state:GameState){
        this.width = width;
        this.height = height;
        this.state = state;
        this.grid = [];
    }

    private createGridLayer(t:number, width:number, height: number, snakes:Battlesnake[] ){
        let gridLayer = new Array(width);
        let currentTime : number = 0; // might implement this later if we need it. its basically at which time step we observed the snakes.
        for (let x: number = 0; x < width; x++) {
          gridLayer[x] = new Array(height);

          for (let y: number = 0; y < height; y++) {
            gridLayer[x][y] = 1;
          }
        }
        // Own positions of snakes
        let ownHead = this.state.you.head;

        for (const snake of snakes) {
            let isSelf: boolean = snake.head.x == ownHead.x && snake.head.y == ownHead.y;

            this.addSnakeToGrid(gridLayer, currentTime, t, snake);

            //TODO: other friendly agents paths

            let isFriendlyAgent:boolean = false;

            if(!isSelf){
                // const friendlyAgentPath : Vector2Int[] | undefined = this.teamCommunicator.getFriendlyAgentPath(snake.id);
                // if(friendlyAgentPath){
                //     this.addFriendlyAgentPath(gridLayer, t, snake, friendlyAgentPath);
                // }
                // else{
                    // IF enemy snake, we also need to take into account potential positions of the snake head at a given time step.
                    this.addPotentialEnemyPositions(gridLayer, t, snake);
                // }
                this.addEnemyOppositionPositions(gridLayer, t, this.state.you, snake);
            }
            else{
                //is self
            }
            // opposition principle: if our head and enemy head are both adjacent to a food item, we only want to go there if our snake size is bigger than theirs.

        }

        return gridLayer;
    }


    private generateSymbolGrid(t:number): string[][] {
        let transposedGrid = this.getGridAtTime(t).map((_, colIndex) => this.getGridAtTime(t).map(row => row[colIndex])).reverse();
        return transposedGrid.map(row =>
            row.map(value => {
                if (value <= 1) {
                    return 'o';
                } else if (value > 1 && value < 10) {
                    return '%';
                } else {
                    return 'X';
                }
            })
        );
    }

    public writeToFile(t:number): void {
        const filename = `logs/obstaclemap-states-${this.state.game.id}-${this.state.you.name}.log`;

        const symbolGrid = this.generateSymbolGrid(t);
        let fileContent = symbolGrid.map(row => row.join(' ')).join('\n') + '\n';
        fileContent = `Turn ${this.state.turn}:\n${fileContent}`;

        fs.writeFileSync(filename, fileContent, { flag: 'a', encoding: 'utf-8' });
    }


    /**
     * This function creates obstacles on coordinates around our own head, where the enemy could also be at the next step. In this case, the largest snake will kill the smaller snake
     * @param gridLayer
     * @param t
     * @param ownSnake The own snake
     * @param otherSnake each of the other snakes except self
     */
    private addEnemyOppositionPositions(gridLayer: number[][], t: number, ownSnake: Battlesnake, otherSnake: Battlesnake){
        // NOTE: this only happens when t=0, since afterwards we don't know where the other snake can be
        // Step 0: if own snake size > otherSnake, we don't care about opposition. Else, we make it an obstacle if a cell is opposing
        // Step 1: get opposition coordinates of friendly snake, minus its tail
        // Step 2: get opposition coordinates of enemy snake, minus its tail
        // Step 3: get the intersection of these 2
        //
        const dirVecs = [new Vector2Int(0,1),new Vector2Int(1,0),new Vector2Int(-1,0),new Vector2Int(0,-1)]
        if(t <= 1 && ownSnake.body.length <= otherSnake.body.length){
            let ownOppositionCoords: Vector2Int[] = [];
            let otherSnakeOppositionCoords: Vector2Int[] = [];

            for(let dir of dirVecs){
                let ownSnakeNewCoord = new Vector2Int(ownSnake.head.x + dir.x, ownSnake.head.y + dir.y);
                if(ownSnake.body.findIndex(s=>s.x == ownSnakeNewCoord.x && s.y == ownSnakeNewCoord.y) === -1){
                    // its not part of its body already
                    ownOppositionCoords.push(ownSnakeNewCoord)
                }

                let otherSnakeNewCoord = new Vector2Int(otherSnake.head.x + dir.x, otherSnake.head.y + dir.y);
                if(otherSnake.body.findIndex(s=>s.x == otherSnakeNewCoord.x && s.y == otherSnakeNewCoord.y) === -1){
                    // its not part of its body already
                    otherSnakeOppositionCoords.push(otherSnakeNewCoord)
                }
            }
            // Step 3: get intersection
            let intersectingCoords = ownOppositionCoords
                .filter(value => otherSnakeOppositionCoords
                .some(value2=>value.x == value2.x && value.y == value2.y));

            for(let intersectingCoord of intersectingCoords){
                // Treat as obstacle
                gridLayer[intersectingCoord.x][intersectingCoord.y] = Math.max(gridLayer[intersectingCoord.x][intersectingCoord.y], this.snakeOppositionPenalty);
            }
        }
    }
    /**
     * Add the path from a friendly agents, which we retrieved from the communication layer, to the game as an obstacle.
     * @param gridLayer
     * @param t
     * @param friendlyPath
     */
    private addFriendlyAgentPath(gridLayer: number[][], t: number, friendlySnake: Battlesnake, friendlyPath: Vector2Int[]){
        // For now, check if node is part of path. If this is true, don't consider it

        let path = friendlyPath.slice().reverse(); //NOTE: slice is to not mutate the original. We need to reverse since we cant to calculate from the head, not tail

        let currentPathLength = t;//TODO:check me, can i use t here? does it make sence? //friendlyPath.length;
        let snakeLength = friendlySnake.body.length;

        // WHICH of the coords of the previous path should we treat as a obstacle? only obstacles which will still be blocked at this moment in time.
        let numToSkip = currentPathLength - (snakeLength as number);
        if(numToSkip < 0) numToSkip = 0;
        let cellCountToCheck = currentPathLength - numToSkip;
        if(cellCountToCheck > 0){
            let currentCellsToChecks = path.slice(0, cellCountToCheck)// only the cells occupied by the snake at the current timestep

            for(let friendlySnakeCell of currentCellsToChecks){
                gridLayer[friendlySnakeCell.x][friendlySnakeCell.y] = Math.max(gridLayer[friendlySnakeCell.x][friendlySnakeCell.y], this.friendlySnakePathCollisionPenalty);
            }
        }
    }


    /**
     *
     * @param currentTime This is the current time step that we are right now
     * @param t this is the time step which we are trying to predict
     * @param snake
     * @param grid
     */
    private addSnakeToGrid(grid: number[][], currentTime: number, t: number, snake: Battlesnake){
        let timeDiff : number = (t - currentTime); // DONT TRAIT END OF TAIL AS OBSTACLE
        let snakeLengthToConsider = snake.body.length - timeDiff;

        if(snakeLengthToConsider > 0){
            for(let bodyPartI: number = 0; bodyPartI < snakeLengthToConsider; bodyPartI++){
                let bodyPart = snake.body[bodyPartI];
                grid[bodyPart.x][bodyPart.y] = this.snakeBodyPenalty;
            }
        }
    }

    private addPotentialEnemyPositions(grid: number[][], t: number, snake: Battlesnake){
        let potentialPositionsMap : Map<string,number> = this.computeProbabilities(snake.head, t, grid)
        for(let pair of potentialPositionsMap){
            let split = pair[0].split(',')
            let x = parseInt(split[0]);
            let y = parseInt(split[1]);
            let probability = pair[1];
            if(loglevel <= LOGLEVEL.DEBUG) console.log(`Probability of ${x}:${y} is ${probability}`)

            let curVal = grid[x][y];
            grid[x][y] = curVal + (probability * this.potentialEnemyPositionCoefficientAmplifier);
        }
    }

    /**
     * Assuming random walks, the enemies should usually be on the outskirts of its movement range, since theyre usually following a objective. Therefore, the probabiltiy of being at a location is most likely to be on its corners of distance
     * @param head
     * @param t
     * @returns
     */
    private computeProbabilities(head: Coord, t: number, grid: number[][]): Map<string, number> {
        const probabilities = new Map<string, number>();
        let totalProbability = 0;

        t = t + 1

        for (let dx = -t; dx <= t; dx++) {
            let x = dx + head.x;
            if(x < 0 || x >= grid.length) continue;

            for (let dy = -t; dy <= t; dy++) {
                let y = dy + head.y;
                if(y < 0 || y >= grid.length) continue;

                if(Math.abs(dx) + Math.abs(dy) > t) continue; // maximum distance

                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= t && distance > 0) {  // ensure within a circle of radius t and not the starting point
                    let probability = distance;  // Simple model: direct proportion to distance
                    totalProbability += probability;
                    probabilities.set(`${x},${y}`, probability);
                }
            }
        }

        // Normalize probabilities to sum to 1
        for (let [key, probability] of probabilities) {
            probabilities.set(key, probability / totalProbability);
        }

        return probabilities;
    }
}
export interface EnemyPositionSearchObject{
    position: Coord;
    steps: number;
    probability: number;
}

/**
 * NOTE: this is old slow code for predicting enemy positions.
    //  * Calculates the probability of the enemy snake to be at a certain cell at a certain moment. NOTE: if this algorithm turns out to be too slow, we can opt for a guassian distribution based approach
    //  * @param grid
    //  * @param t how many time steps from the current time at which the enemy snake is observed
    //  * @param snake
    //  * @returns Map containing the probability of the enemy head being at a certain cell at a certain time step in the future
    //  */
    // private calculatePotentialEnemyPositions(grid: number[][], t: number, snake: Battlesnake): Map<string, number> {
    //     let distanceToCheck = Math.min(t, 5);
    //     let head = snake.head;
    //     let queue: EnemyPositionSearchObject[] = [];
    //     let probabilityMap = new Map<string, number>();

    //     // Directions: right, left, down, up
    //     const directions = [
    //         { dx: 1, dy: 0 },
    //         { dx: -1, dy: 0 },
    //         { dx: 0, dy: 1 },
    //         { dx: 0, dy: -1 }
    //     ];

    //     // Helper function to create a unique key for each position
    //     const positionKey = (x: number, y: number): string => `${x},${y}`;

    //     // Start BFS from the snake's head
    //     queue.push({ position: head, steps: 0, probability: 1 });
    //     probabilityMap.set(positionKey(head.x, head.y), 1);

    //     while (queue.length > 0) {
    //         let _data = queue.shift();
    //         if (!_data) break;
    //         let data = _data as EnemyPositionSearchObject

    //         if (data.steps < distanceToCheck) {
    //             let validMoves = 0;
    //             let nextPositions: Coord[] = [];

    //             // Calculate valid moves from the current position
    //             directions.forEach(dir => {
    //                 let newX = data.position.x + dir.dx;
    //                 let newY = data.position.y + dir.dy;

    //                 if (newX >= 0 && newX < grid[0].length && newY >= 0 && newY < grid.length) {
    //                     validMoves++;
    //                     nextPositions.push({ x: newX, y: newY });
    //                 }
    //             });

    //             // Update probabilities for each valid move
    //             nextPositions.forEach(pos => {
    //                 let nextProbability = data.probability / validMoves;
    //                 let key = positionKey(pos.x, pos.y);
    //                 let currentProbability = probabilityMap.get(key) || 0;
    //                 probabilityMap.set(key, currentProbability + nextProbability);
    //                 queue.push({ position: pos, steps: data.steps + 1, probability: nextProbability });
    //             });
    //         }
    //     }

    //     return probabilityMap;
    // }
