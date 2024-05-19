import { GameState } from "../../types";
import { AgentAction } from "./agent";
import { AgentManager, AgentManagerConfig } from "./agent-manager";

export interface GameManagerConfig extends AgentManagerConfig {
}

export class GameManager {
    private readonly agentManagers = new Map<string, AgentManager>();

    constructor(private readonly config: GameManagerConfig) {}

    private getAndSetAgentManager(gameId: string): AgentManager {
        let agentManager = this.agentManagers.get(gameId);

        if (agentManager === undefined) {
            agentManager = new AgentManager(this.config);
            this.agentManagers.set(gameId, agentManager);
        }

        return agentManager;
    }

    tick(gameState: GameState): void {
        this.getAndSetAgentManager(gameState.game.id).tick(gameState);
    }

    performAction(gameState: GameState): AgentAction {
        return this.getAndSetAgentManager(gameState.game.id).performAction(gameState);
    }

    clear(gameState: GameState): void {
        this.agentManagers.delete(gameState.game.id);
    }
}
