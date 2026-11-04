/**
 * Criterion2_PinchLampTest.ts
 * LEAF Scenario verifying Done Criterion 2:
 * "The user can pinch and pick up a battery lamp and see recommended target placement spots appear on room surfaces."
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { sleep } from "Leaf.lspkg/Utils/common/Utils";
import { FelicitaApp } from "../Scripts/FelicitaApp";
import { FelicitaLeafInteractor } from "./FelicitaLeafInteractor";

@component
export class Criterion2_PinchLampTest extends Scenario {
    public async run(): Promise<void> {
        print("[LEAF] Running Scenario: Criterion 2 - Pinch Lamp & Reveal Target Spots");
        const interactor = new FelicitaLeafInteractor();
        const app = FelicitaApp.getInstance();
        expect(app).toBeTruthy();

        await sleep(500);

        // Pick up the Big Blue Lamp
        const lamp = await interactor.pickUpLamp("Lamp_blue_lamp");
        expect(lamp.isHeld).toBe(true);
        expect(app!.isHoldingLamp).toBe(true);

        // Verify target placement spots on room surfaces are now active and highlighted
        expect(app!.spots.length).toBeGreaterThanOrEqual(3);
        for (const spot of app!.spots) {
            expect(spot.isActive).toBe(true);
        }

        print("[LEAF PASS] Criterion 2: Pinching lamp successfully reveals recommended surface hotspots.");
    }
}

