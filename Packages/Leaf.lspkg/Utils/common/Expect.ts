/**
 * LEAF Framework - Expect Assertions
 */
export class Expectation {
    constructor(private actual: any) {}

    public toBe(expected: any): void {
        if (this.actual !== expected) {
            throw new Error(`[LEAF Assertion Failed] Expected ${expected}, but got ${this.actual}`);
        }
    }

    public toEqual(expected: any): void {
        if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
            throw new Error(`[LEAF Assertion Failed] Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(this.actual)}`);
        }
    }

    public toBeTruthy(): void {
        if (!this.actual) {
            throw new Error(`[LEAF Assertion Failed] Expected truthy, but got ${this.actual}`);
        }
    }

    public toBeFalsy(): void {
        if (this.actual) {
            throw new Error(`[LEAF Assertion Failed] Expected falsy, but got ${this.actual}`);
        }
    }

    public toBeGreaterThan(val: number): void {
        if (!(this.actual > val)) {
            throw new Error(`[LEAF Assertion Failed] Expected ${this.actual} to be greater than ${val}`);
        }
    }

    public toBeGreaterThanOrEqual(val: number): void {
        if (!(this.actual >= val)) {
            throw new Error(`[LEAF Assertion Failed] Expected ${this.actual} to be greater than or equal to ${val}`);
        }
    }

    public toBeLessThan(val: number): void {
        if (!(this.actual < val)) {
            throw new Error(`[LEAF Assertion Failed] Expected ${this.actual} to be less than ${val}`);
        }
    }
}

export function expect(actual: any): Expectation {
    return new Expectation(actual);
}

