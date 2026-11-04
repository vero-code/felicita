/**
 * LEAF Framework - Utilities
 */

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        // Use DelayedCallbackEvent or setTimeout fallback
        if (typeof (global as any).scene !== "undefined") {
            const root = (global as any).scene.getRootObject(0);
            if (root) {
                const dummy = root.createComponent("Component.ScriptComponent");
                const evt = dummy.createEvent("DelayedCallbackEvent");
                evt.bind(() => {
                    dummy.destroy();
                    resolve();
                });
                evt.reset(ms / 1000.0);
                return;
            }
        }
        setTimeout(resolve, ms);
    });
}

export function nextFrame(): Promise<void> {
    return sleep(33);
}

export function findSceneObjectByName(name: string): SceneObject | null {
    const count = global.scene.getRootObjectsCount();
    for (let i = 0; i < count; i++) {
        const root = global.scene.getRootObject(i);
        const match = searchRecursive(root, name);
        if (match) return match;
    }
    return null;
}

export function findSceneObjectsByName(name: string): SceneObject[] {
    const results: SceneObject[] = [];
    const count = global.scene.getRootObjectsCount();
    for (let i = 0; i < count; i++) {
        const root = global.scene.getRootObject(i);
        searchAllRecursive(root, name, results);
    }
    return results;
}

function searchRecursive(obj: SceneObject, name: string): SceneObject | null {
    if (obj.name === name) return obj;
    const childCount = obj.getChildrenCount();
    for (let i = 0; i < childCount; i++) {
        const res = searchRecursive(obj.getChild(i), name);
        if (res) return res;
    }
    return null;
}

function searchAllRecursive(obj: SceneObject, name: string, outList: SceneObject[]): void {
    if (obj.name === name) outList.push(obj);
    const childCount = obj.getChildrenCount();
    for (let i = 0; i < childCount; i++) {
        searchAllRecursive(obj.getChild(i), name, outList);
    }
}

