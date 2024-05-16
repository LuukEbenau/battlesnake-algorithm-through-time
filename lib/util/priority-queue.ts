export class PriorityQueue<T> {
    private items: [T, number][] = [];
    private isSorted = true;

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    enqueue(item: T, priority: number): void {
        this.items.push([item, priority]);
        this.isSorted = false;
    }

    dequeue(): T {
        if (!this.isSorted) {
            // sort from largest to smallest
            this.items.sort((a, b) => b[1] - a[1]);
            this.isSorted = true;
        }

        const item = this.items.pop();

        if (item === undefined) {
            throw new Error("empty queue");
        }


        return item[0];
    }
    clear(){
        this.items = [];
    }
}
