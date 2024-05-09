import { Vector2Int } from "./vectors";

export function *iterateDirections(root = Vector2Int.zero()): IterableIterator<Vector2Int> {
    yield root.add(new Vector2Int(-1, 0));
    yield root.add(new Vector2Int(1, 0));
    yield root.add(new Vector2Int(0, -1));
    yield root.add(new Vector2Int(0, 1));
}

export function getDirections(root?: Vector2Int): Vector2Int[] {
    return [...iterateDirections(root)];
}
