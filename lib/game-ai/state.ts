import { stat } from "fs";
import { Battlesnake, Coord, GameState } from "../../types";
import { AStar } from "../path-finding";
import { GameAStarProvider } from "../path-finding/providers/game-astar";
import { StandardAStar } from "../path-finding/standard-astar";
import { Vector2Int } from "../util/vectors";
import { AgentState } from "./agent";
import { ObstacleGrid } from "./obstaclegrid";

export class GameAgentState implements AgentState {
    private readonly provider: GameAStarProvider;
    readonly aStar: AStar<Vector2Int>;

    private obstacleMap: ObstacleGrid;
    state: GameState | undefined;


    constructor() {
        this.provider = new GameAStarProvider();
        this.aStar = new StandardAStar(this.provider);
        this.obstacleMap = new ObstacleGrid();
    }

    get gameState() {
        if (this.state === undefined) {
            throw new Error("GameState not defined");
        }

        return this.state;
    }

    updateState(state: GameState): void {
        this.state = state;
        this.obstacleMap.createInitialGrid(state.board.width,state.board.height, state);

        this.provider.updateState(this.obstacleMap);
    }

    get currentPosition(): Vector2Int {
        return Vector2Int.fromCoord(this.gameState.you.head);
    }

    isCellInGrid(cell: Vector2Int): boolean {
        return this.obstacleMap.getGridAtTime(0)[cell.x]?.[cell.y] !== undefined;
    }

    isCellFree(cell: Vector2Int): boolean {
        return this.obstacleMap.getGridAtTime(0)[cell.x][cell.y] <= 1;
    }
}
