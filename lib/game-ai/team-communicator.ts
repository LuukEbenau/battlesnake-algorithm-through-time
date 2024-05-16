import { GameState } from "../../types";
import { Vector2Int } from "../util/vectors";

export class TeamCommunicator {
    private readonly teamIds = new Set<string>();

    private readonly players = new Map<string, Vector2Int[]>();
    private foods: Vector2Int[] = [];

    private foodToOwner = new Map<string, string>();
    private nextFoodToOwner = new Map<string, string>();

    private agentPaths = new Map<string, Vector2Int[]>();
    private nextAgentPaths = new Map<string, Vector2Int[]>();

    private enemyToOwner = new Map<string, string>();
    private nextEnemyToOwner = new Map<string, string>();

    constructor(private readonly maxCutoffAgents: number) {
    }

    tick(gameState: GameState): void {
        this.teamIds.add(gameState.you.id);

        this.players.clear();

        for (const snake of gameState.board.snakes) {
            this.players.set(snake.id, snake.body.map(b => Vector2Int.fromCoord(b)));
        }

        this.foods = gameState.board.food.map(f => Vector2Int.fromCoord(f));

        this.foodToOwner = this.nextFoodToOwner;
        this.nextFoodToOwner = new Map();

        this.agentPaths = this.nextAgentPaths;
        this.nextAgentPaths = new Map();

        this.enemyToOwner = this.nextEnemyToOwner;
        this.nextEnemyToOwner = new Map();
    }
    *iterateAvailableFoods(agentId: string): IterableIterator<Vector2Int> {
        for (const food of this.foods) {
            const foodStr = food.toJSONString();
            const foodOwnerId = this.foodToOwner.get(foodStr);
            const nextFoodOwnerId = this.nextFoodToOwner.get(foodStr);

            // Food is not claimed OR food is claimed by me
            //  No other agent has already claimed the food OR i claimed the food.
            // TODO: right now the food is given to the agent which is first to claim the food. We would like it to be given to the closest agent instead when in doubt?
            if ((foodOwnerId === undefined || foodOwnerId === agentId) && (nextFoodOwnerId === undefined || nextFoodOwnerId === agentId)) {
                yield food;
            }
        }
    }
    getAvailableFoods(agentId: string): Vector2Int[] {
        return [...this.iterateAvailableFoods(agentId)];
    }
    getAllFoods(): Vector2Int[] {
        return this.foods;
    }
    claimFood(agentId: string, food: Vector2Int): void {
        this.nextFoodToOwner.set(food.toJSONString(), agentId);
    }
    getFriendlyAgentPath(agentId: string): Vector2Int[] | undefined {
        return this.agentPaths.get(agentId);
    }
    setAgentPath(agentId: string, path: Vector2Int[]): void {
        this.nextAgentPaths.set(agentId, path);
    }
    *iterateTeamMembers(agentId: string): IterableIterator<string> {
        for (const otherAgentId of this.teamIds) {
            if (otherAgentId !== agentId) {
                yield otherAgentId;
            }
        }
    }
    getTeamMembers(agentId: string): string[] {
        return [...this.iterateTeamMembers(agentId)];
    }
    *iterateTargetableEnemies(agentId: string, distance: (agentPos: Vector2Int[], enemyPos: Vector2Int[]) => number): IterableIterator<[string, Vector2Int[]]> {
        const nextEnemyId = this.nextEnemyToOwner.get(agentId);
        if (nextEnemyId !== undefined) {
            const body = this.players.get(nextEnemyId);

            if (body === undefined) {
                throw new Error("should never happen")
            }

            yield [nextEnemyId, body];
        }

        if (this.nextEnemyToOwner.size >= this.maxCutoffAgents || this.enemyToOwner.size >= this.maxCutoffAgents) {
            return;
        }

        const enemyId = this.nextEnemyToOwner.get(agentId);
        if (enemyId !== undefined) {
            const body = this.players.get(enemyId);

            if (body === undefined) {
                throw new Error("should never happen")
            }

            yield [enemyId, body];
        }

        const players = [...this.players.entries()]
            .sort(([aId, aBody], [bId, bBody]) => distance(aBody, bBody));

        for (const [playerId, body] of players) {
            const ownerId = this.enemyToOwner.get(playerId);
            const nextOwnerId = this.nextEnemyToOwner.get(playerId);

            if (playerId === enemyId || playerId === nextEnemyId) {
                continue;
            }

            if ((ownerId === undefined || ownerId === agentId) && (nextOwnerId === undefined || nextOwnerId === ownerId)) {
                yield [playerId, body];
            }
        }
    }
    getTargetableEnemies(agentId: string, distance: (agentPos: Vector2Int[], enemyPos: Vector2Int[]) => number): [string, Vector2Int[]][] {
        return [...this.iterateTargetableEnemies(agentId, distance)];
    }
    targetEnemy(agentId: string, enemyId: string): void {
        this.nextEnemyToOwner.set(enemyId, agentId);
    }
}
