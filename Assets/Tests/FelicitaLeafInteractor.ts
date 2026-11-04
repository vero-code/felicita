/**
 * FelicitaLeafInteractor.ts
 * Custom LEAF interactor providing convenience actions for Felicita interactions.
 */

import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import { findInteractableByName } from "Leaf.lspkg/Interactors/InteractableUtils";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { FelicitaApp } from "../Scripts/FelicitaApp";
import { SpatialLamp } from "../Scripts/SpatialLamp";

export class FelicitaLeafInteractor extends DefaultLeafInteractor {
    public async pickUpLamp(lampSceneName: string): Promise<SpatialLamp> {
        const obj = findSceneObjectByName(lampSceneName);
        if (!obj) {
            throw new Error(`[FelicitaLeafInteractor] Scene object ${lampSceneName} not found`);
        }
        const lamp = obj.getComponent(SpatialLamp.getTypeName()) as SpatialLamp;
        if (!lamp) {
            throw new Error(`[FelicitaLeafInteractor] SpatialLamp component not found on ${lampSceneName}`);
        }
        lamp.handlePickUp();
        await sleep(250);
        return lamp;
    }

    public async placeLampOnSpot(lampSceneName: string, spotId: string): Promise<void> {
        const lamp = await this.pickUpLamp(lampSceneName);
        const app = FelicitaApp.getInstance();
        if (!app) throw new Error("FelicitaApp not found");

        const spot = app.spots.find((s) => s.spotId === spotId);
        if (!spot) throw new Error(`Spot ${spotId} not found`);

        lamp.snapToSpot(spot);
        app.onLampPlaced(lamp, spot);
        await sleep(300);
    }

    public async triggerCornerMarker(): Promise<void> {
        const app = FelicitaApp.getInstance();
        if (!app || !app.emergencyStore) {
            throw new Error("EmergencyStoreCard component not found");
        }
        app.emergencyStore.openCard();
        await sleep(200);
    }

    public async orderFromStore(): Promise<void> {
        const app = FelicitaApp.getInstance();
        if (!app || !app.emergencyStore) {
            throw new Error("EmergencyStoreCard component not found");
        }
        app.emergencyStore.handleOrder();
        await sleep(200);
    }
}

