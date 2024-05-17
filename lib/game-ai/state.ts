import { GameState } from "../../types";
import { AStar } from "../path-finding";
import { GameAStarProvider } from "../path-finding/providers/game-astar";
import { StandardAStar } from "../path-finding/standard-astar";
import { StandardAStarWithEscape } from "../path-finding/standard-astar-with-escape";
import { Vector2Int } from "../util/vectors";
import { AgentState } from "./agent";
import { ObstacleGrid } from "./obstaclegrid";
import { TeamCommunicator } from "./team-communicator";

export interface GameAgentStateConfig {
    aStarMaxIterationCount: number;
}

export class GameAgentState implements AgentState {
    private readonly provider: GameAStarProvider;
    public readonly obstacleMap: ObstacleGrid;

    readonly aStar: AStar<Vector2Int>;
    readonly aStarWithEscape: AStar<Vector2Int>;

    constructor(config: GameAgentStateConfig, private readonly state: GameState, public readonly teamCommunicator: TeamCommunicator) {
        this.provider = new GameAStarProvider(teamCommunicator);
        this.obstacleMap = new ObstacleGrid(state, teamCommunicator);
        this.aStar = new  StandardAStar(this.provider, config.aStarMaxIterationCount);
        this.aStarWithEscape = new StandardAStarWithEscape(this.provider, state, config.aStarMaxIterationCount);
    }

    get agentId(): string {
        return this.state.you.id;
    }

    get gameState() {
        return this.state;
    }

    updateState(newState: GameState): void {
        this.state.board = newState.board;
        this.state.game = newState.game;
        this.state.turn = newState.turn;
        this.state.you = newState.you;
        // this.state = state;
        this.obstacleMap.createInitialGrid(this.state.board.width,this.state.board.height, this.state);

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
