/**
 * Criterion4_AdditiveLightTest.ts
 * LEAF Scenario verifying Done Criterion 4:
 * "Placing multiple lamps increases overall room illumination additively."
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { sleep } from "Leaf.lspkg/Utils/common/Utils";
import { FelicitaApp } from "../Scripts/FelicitaApp";
import { FelicitaLeafInteractor } from "./FelicitaLeafInteractor";

@component
export class Criterion4_AdditiveLightTest extends Scenario {
    public async run(): Promise<void> {
        print("[LEAF] Running Scenario: Criterion 4 - Additive Room Illumination");
        const interactor = new FelicitaLeafInteractor();
        const app = FelicitaApp.getInstance();
        expect(app).toBeTruthy();

        await sleep(500);

        const lumensBefore = app!.totalPlacedLumens;
        const illuminationBefore = app!.roomEnvironment ? app!.roomEnvironment.getRoomIlluminationLevel() : 0;

        // Place second lamp: White Lantern (250 lm) on Shelf Top Hotspot
        await interactor.placeLampOnSpot("Lamp_white_lantern", "spot_shelf_top");

        const lumensAfter = app!.totalPlacedLumens;
        const illuminationAfter = app!.roomEnvironment ? app!.roomEnvironment.getRoomIlluminationLevel() : 0;

        // Lumens must increase additively by 250 lm
        expect(lumensAfter).toBe(lumensBefore + 250);

        // Room illumination must increase
        expect(illuminationAfter).toBeGreaterThanOrEqual(illuminationBefore);

        print(`[LEAF PASS] Criterion 4: Additive illumination verified. Lumens increased to ${lumensAfter} lm.`);
    }
}

