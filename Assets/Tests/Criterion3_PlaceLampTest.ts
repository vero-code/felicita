/**
 * Criterion3_PlaceLampTest.ts
 * LEAF Scenario verifying Done Criterion 3:
 * "Placing a lamp on a target spot snaps it in place, activates its light coverage zone, and updates the room lumen counter."
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { sleep } from "Leaf.lspkg/Utils/common/Utils";
import { FelicitaApp } from "../Scripts/FelicitaApp";
import { FelicitaLeafInteractor } from "./FelicitaLeafInteractor";

@component
export class Criterion3_PlaceLampTest extends Scenario {
    public async run(): Promise<void> {
        print("[LEAF] Running Scenario: Criterion 3 - Snap Placement, Light Zone & Lumen Counter");
        const interactor = new FelicitaLeafInteractor();
        const app = FelicitaApp.getInstance();
        expect(app).toBeTruthy();

        await sleep(500);

        // Snap Big Blue Lamp (400 lm) onto Table Center Hotspot
        await interactor.placeLampOnSpot("Lamp_blue_lamp", "spot_table_center");

        const lamp = app!.lamps.find((l) => l.lampId === "blue_lamp");
        expect(lamp).toBeTruthy();
        expect(lamp!.isPlaced).toBe(true);

        const spot = app!.spots.find((s) => s.spotId === "spot_table_center");
        expect(spot).toBeTruthy();
        expect(spot!.isOccupied).toBe(true);

        // Verify Light Coverage Zone is active
        expect(lamp!.coverageZone).toBeTruthy();
        expect(lamp!.coverageZone!.isZoneActive).toBe(true);

        // Verify Lumen counter updated
        expect(app!.totalPlacedLumens).toBeGreaterThanOrEqual(400);

        print(`[LEAF PASS] Criterion 3: Lamp snapped, light zone active, and counter updated to +${app!.totalPlacedLumens} lm.`);
    }
}

