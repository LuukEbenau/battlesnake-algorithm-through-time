import { GameState } from "../../types";
import { Vector2Int } from "../util/vectors";

export class TeamCommunicator {
    private readonly teamIds = new Set<string>();

    private foods: Vector2Int[] = [];

    private foodToOwner = new Map<string, string>();
    private nextFoodToOwner = new Map<string, string>();

    private agentPaths = new Map<string, Vector2Int[]>();
    private nextAgentPaths = new Map<string, Vector2Int[]>();

    tick(gameState: GameState): void {
        this.teamIds.add(gameState.you.id);
        this.foods = gameState.board.food.map(f => Vector2Int.fromCoord(f));

        this.foodToOwner = this.nextFoodToOwner;
        this.nextFoodToOwner = new Map();

        this.agentPaths = this.nextAgentPaths;
        this.nextAgentPaths = new Map();
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
    claimFood(agentId: string, food: Vector2Int) {
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
}
