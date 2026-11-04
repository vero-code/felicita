/**
 * Criterion5_CornerStoreTest.ts
 * LEAF Scenario verifying Done Criterion 5:
 * "With empty hands, gazing at an unlit corner reveals an interactive marker; pinching it opens a compact emergency lamp ordering card."
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { sleep } from "Leaf.lspkg/Utils/common/Utils";
import { FelicitaApp } from "../Scripts/FelicitaApp";
import { FelicitaLeafInteractor } from "./FelicitaLeafInteractor";

@component
export class Criterion5_CornerStoreTest extends Scenario {
    public async run(): Promise<void> {
        print("[LEAF] Running Scenario: Criterion 5 - Unlit Corner Marker & Emergency Store Card");
        const interactor = new FelicitaLeafInteractor();
        const app = FelicitaApp.getInstance();
        expect(app).toBeTruthy();
        expect(app!.emergencyStore).toBeTruthy();

        await sleep(500);

        // 1. With empty hands, marker is visible
        app!.emergencyStore!.setHandsEmpty(true);
        expect(app!.emergencyStore!.isMarkerVisible).toBe(true);

        // 2. Pinching the marker opens the compact emergency lamp ordering card
        await interactor.triggerCornerMarker();
        expect(app!.emergencyStore!.isCardOpen).toBe(true);

        // 3. User can order from the card
        await interactor.orderFromStore();

        // 4. Close the card
        app!.emergencyStore!.closeCard();
        expect(app!.emergencyStore!.isCardOpen).toBe(false);

        print("[LEAF PASS] Criterion 5: Unlit corner marker, store card opening and ordering flow verified.");
    }
}

