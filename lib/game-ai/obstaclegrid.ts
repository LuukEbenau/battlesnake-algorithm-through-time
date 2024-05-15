import { Battlesnake, Coord, GameState } from "../../types";
import { TeamCommunicator } from "./team-communicator";

export class ObstacleGrid{
    private readonly snakeBodyPenalty = 20000 // some high number, as long as its >10000 it should be fine
    private readonly potentialEnemyPositionCoefficientAmplifier = 15;

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
    public getGridAtTime(t:number):number[][]{
        let currentGridSize = this.grid.length;
        if(t>=currentGridSize){
            // add extra layers, in case it doesnt exist yet
            for(let i = currentGridSize; i <= t; i++){
                this.grid[i] = this.createGridLayer(i,this.width, this.height, this.state?.board.snakes as Battlesnake[])
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
        let ownHead = this.state?.you.head;
        for (const snake of snakes) {
          this.addSnakeToGrid(gridLayer,currentTime, t, snake);

          // IF enemy snake, we also need to take into account potential positions of the snake head at a given time step.
          if(ownHead && snake.head.x != ownHead.x && snake.head.y != ownHead.y){
            this.addPotentialEnemyPositions(gridLayer, t, snake);
          }
        }

        return gridLayer;
    }

    /**
     *
     * @param currentTime This is the current time step that we are right now
     * @param t this is the time step which we are trying to predict
     * @param snake
     * @param grid
     */
    private addSnakeToGrid(grid: number[][],currentTime:number, t:number, snake:Battlesnake){
        let timeDiff : number = t - currentTime;
        let snakeLengthToConsider = snake.body.length - timeDiff;

        if(snakeLengthToConsider > 0){
            for(let bodyPartI: number = 0; bodyPartI < snakeLengthToConsider; bodyPartI++){
                let bodyPart = snake.body[bodyPartI];
                grid[bodyPart.x][bodyPart.y] = this.snakeBodyPenalty;
            }
        }
    }

    private addPotentialEnemyPositions(grid: number[][], t: number, snake: Battlesnake){
        let potentialPositionsMap : Map<string,number> = this.computeProbabilities(snake.head,t, grid)
        for(let pair of potentialPositionsMap){
            let split = pair[0].split(',')
            let x = parseInt(split[0]);
            let y = parseInt(split[1]);
            let probability = pair[1];
            // console.log(`Probability of ${x}:${y} is ${probability}`)

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
