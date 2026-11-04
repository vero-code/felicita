/**
 * LEAF Framework - Interactable Utilities
 */
import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { findSceneObjectByName, findSceneObjectsByName } from "../Utils/common/Utils";

export function findInteractableByName(name: string): Interactable | null {
    const obj = findSceneObjectByName(name);
    if (!obj) return null;
    return obj.getComponent(Interactable.getTypeName()) as Interactable;
}

export function findInteractablesByName(name: string): Interactable[] {
    const objs = findSceneObjectsByName(name);
    const result: Interactable[] = [];
    for (const obj of objs) {
        const comp = obj.getComponent(Interactable.getTypeName()) as Interactable;
        if (comp) result.push(comp);
    }
    return result;
}

