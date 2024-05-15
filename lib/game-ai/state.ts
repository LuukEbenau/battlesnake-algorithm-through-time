import { GameState } from "../../types";
import { AStar } from "../path-finding";
import { GameAStarProvider } from "../path-finding/providers/game-astar";
import { StandardAStar } from "../path-finding/standard-astar";
import { Vector2Int } from "../util/vectors";
import { AgentState } from "./agent";
import { ObstacleGrid } from "./obstaclegrid";
import { TeamCommunicator } from "./team-communicator";

export interface GameAgentStateConfig {
    aStarMaxIterationCount: number;
}

export class GameAgentState implements AgentState {
    private readonly provider: GameAStarProvider;
    private readonly obstacleMap: ObstacleGrid;

    readonly aStar: AStar<Vector2Int>;

    constructor(config: GameAgentStateConfig, private state: GameState, public readonly teamCommunicator: TeamCommunicator) {
        this.provider = new GameAStarProvider(teamCommunicator);
        this.obstacleMap = new ObstacleGrid(state, teamCommunicator);
        this.aStar = new StandardAStar(this.provider, config.aStarMaxIterationCount);
    }

    get agentId(): string {
        return this.state.you.id;
    }

    get gameState() {
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
