const operations = new Map();

export function getOperation(idempotencyKey) {
    return operations.get(idempotencyKey) ?? null;
}

export function recordOperation(idempotencyKey, operation) {
    operations.set(idempotencyKey, Object.freeze({ ...operation }));
    return operations.get(idempotencyKey);
}

export function clearOperations() {
    operations.clear();
}

