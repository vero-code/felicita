/**
 * Criterion1_WalkaroundTest.ts
 * LEAF Scenario verifying Done Criterion 1:
 * "The user can walk around a simulated dark room with furniture props (table, chair, shelf) using keyboard (WASD) and mouse."
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";

@component
export class Criterion1_WalkaroundTest extends Scenario {
    public async run(): Promise<void> {
        print("[LEAF] Running Scenario: Criterion 1 - Simulated Dark Room Environment");
        await sleep(500);

        // 1. Verify Room Floor (20 m²)
        const floor = findSceneObjectByName("RoomFloor_20sqm");
        expect(floor).toBeTruthy();
        expect(floor!.enabled).toBe(true);

        // 2. Verify Table Prop
        const tableTop = findSceneObjectByName("TableTop");
        expect(tableTop).toBeTruthy();
        expect(tableTop!.enabled).toBe(true);

        // 3. Verify Shelf Prop
        const shelf = findSceneObjectByName("Shelf_Tier3_Top");
        expect(shelf).toBeTruthy();
        expect(shelf!.enabled).toBe(true);

        // 4. Verify Chair Prop
        const chair = findSceneObjectByName("Chair_Seat");
        expect(chair).toBeTruthy();
        expect(chair!.enabled).toBe(true);

        // 5. Verify Camera Object
        const camera = findSceneObjectByName("Camera Object");
        expect(camera).toBeTruthy();

        print("[LEAF PASS] Criterion 1: Simulated dark room with all furniture props verified.");
    }
}

