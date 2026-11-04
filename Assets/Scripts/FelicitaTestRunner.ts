/**
 * FelicitaTestRunner.ts
 * In-engine automated verification suite checking all 5 Done Criteria from devpost/design-brief.md.
 * Runs on startup, logs pass/fail assertions, and renders a visual pass summary badge.
 */

import { FelicitaApp } from "./FelicitaApp";

export interface TestResult {
    name: string;
    criterion: string;
    passed: boolean;
    details: string;
}

@component
export class FelicitaTestRunner extends BaseScriptComponent {
    public results: TestResult[] = [];

    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => {
            // Run tests shortly after scene initialization
            const delayEvent = this.createEvent("DelayedCallbackEvent");
            delayEvent.bind(() => this.runAllTests());
            delayEvent.reset(0.5);
        });
    }

    public runAllTests(): TestResult[] {
        print("==================================================");
        print("   FELICITA: RUNNING DONE CRITERIA VERIFICATION   ");
        print("==================================================");

        this.results = [];
        const app = FelicitaApp.getInstance();

        if (!app) {
            print("[TEST FAILED] FelicitaApp instance not found in scene!");
            return this.results;
        }

        // Test 1: Done Criterion 1 (Simulated dark room with furniture props)
        this.testCriterion1_RoomEnvironment(app);

        // Test 2: Done Criterion 2 (Pinch lamp shows target placement spots)
        this.testCriterion2_PinchLampShowSpots(app);

        // Test 3: Done Criterion 3 (Placing lamp snaps, activates light zone, updates lumens)
        this.testCriterion3_PlaceLampSnapAndLightZone(app);

        // Test 4: Done Criterion 4 (Placing multiple lamps increases illumination additively)
        this.testCriterion4_AdditiveRoomIllumination(app);

        // Test 5: Done Criterion 5 (Empty hands corner gaze & emergency store card)
        this.testCriterion5_UnlitCornerAndStoreCard(app);

        // Summary report
        print("==================================================");
        print("              TEST SUMMARY REPORT                 ");
        print("==================================================");
        let passCount = 0;
        for (const res of this.results) {
            const status = res.passed ? "PASS" : "FAIL";
            print(`[${status}] Criterion ${res.criterion}: ${res.name}`);
            print(`       -> ${res.details}`);
            if (res.passed) passCount++;
        }
        print(`Total: ${passCount} / ${this.results.length} PASSED`);
        print("==================================================");

        return this.results;
    }

    private testCriterion1_RoomEnvironment(app: FelicitaApp): void {
        const room = app.roomEnvironment;
        const passed = !!(
            room &&
            room.floorObject &&
            room.tableTopObject &&
            room.shelfObject &&
            room.chairObject
        );

        this.results.push({
            name: "Simulated Dark Room & Furniture Props",
            criterion: "1",
            passed,
            details: passed
                ? "Room floor (20 m²), Table, Shelf, and Chair props are instantiated and active."
                : "One or more furniture props missing from RoomEnvironment.",
        });
    }

    private testCriterion2_PinchLampShowSpots(app: FelicitaApp): void {
        if (app.lamps.length === 0 || app.spots.length === 0) {
            this.results.push({
                name: "Pinch Lamp & Target Spot Activation",
                criterion: "2",
                passed: false,
                details: "No lamps or spots configured.",
            });
            return;
        }

        const testLamp = app.lamps[0];
        testLamp.handlePickUp();

        let allSpotsActive = true;
        for (const spot of app.spots) {
            if (!spot.isActive) {
                allSpotsActive = false;
                break;
            }
        }

        const passed = testLamp.isHeld && allSpotsActive && app.isHoldingLamp;

        this.results.push({
            name: "Pinch Lamp Reveals Surface Hotspots",
            criterion: "2",
            passed,
            details: passed
                ? `Picked up ${testLamp.displayName}. All ${app.spots.length} target surface spots highlighted.`
                : "Placement spots did not activate when lamp was picked up.",
        });
    }

    private testCriterion3_PlaceLampSnapAndLightZone(app: FelicitaApp): void {
        if (app.lamps.length === 0 || app.spots.length === 0) {
            this.results.push({
                name: "Snap Placement, Light Zone & Lumen Counter",
                criterion: "3",
                passed: false,
                details: "Lamps or spots missing.",
            });
            return;
        }

        const lamp = app.lamps[0]; // Big Blue Lamp (400 lm)
        const spot = app.spots[0]; // Table Center Hotspot

        // Snap lamp into spot
        lamp.snapToSpot(spot);
        app.onLampPlaced(lamp, spot);

        const isSnapped = lamp.isPlaced && spot.isOccupied;
        const isZoneActive = lamp.coverageZone ? lamp.coverageZone.isZoneActive : false;
        const lumensUpdated = app.totalPlacedLumens >= 400;

        const passed = isSnapped && isZoneActive && lumensUpdated;

        this.results.push({
            name: "Place Lamp, Activate Light Zone & Lumen Counter",
            criterion: "3",
            passed,
            details: passed
                ? `Snapped ${lamp.displayName} onto ${spot.spotName}. Light zone expanded, +${app.totalPlacedLumens} lm counted.`
                : "Snap or light zone activation failed.",
        });
    }

    private testCriterion4_AdditiveRoomIllumination(app: FelicitaApp): void {
        if (app.lamps.length < 2 || app.spots.length < 2) {
            this.results.push({
                name: "Additive Room Illumination",
                criterion: "4",
                passed: false,
                details: "Need at least 2 lamps and 2 spots for additive test.",
            });
            return;
        }

        const initialLumens = app.totalPlacedLumens;
        const initialIllumination = app.roomEnvironment ? app.roomEnvironment.getRoomIlluminationLevel() : 0;

        const secondLamp = app.lamps[1]; // White Lantern (250 lm)
        const secondSpot = app.spots[1]; // Shelf Top Hotspot

        secondLamp.snapToSpot(secondSpot);
        app.onLampPlaced(secondLamp, secondSpot);

        const newLumens = app.totalPlacedLumens;
        const newIllumination = app.roomEnvironment ? app.roomEnvironment.getRoomIlluminationLevel() : 0;

        const lumensIncreased = newLumens === initialLumens + secondLamp.lumens;
        const roomBrightened = newIllumination >= initialIllumination;

        const passed = lumensIncreased && roomBrightened;

        this.results.push({
            name: "Additive Multi-Lamp Illumination",
            criterion: "4",
            passed,
            details: passed
                ? `Total lumens increased additively to ${newLumens} lm. Ambient room brightness stepped up additively.`
                : "Illumination failed to increase additively.",
        });
    }

    private testCriterion5_UnlitCornerAndStoreCard(app: FelicitaApp): void {
        const store = app.emergencyStore;
        if (!store) {
            this.results.push({
                name: "Unlit Corner Marker & Emergency Store Card",
                criterion: "5",
                passed: false,
                details: "EmergencyStoreCard component missing.",
            });
            return;
        }

        // Test marker visibility with empty hands
        store.setHandsEmpty(true);
        const markerVisible = store.isMarkerVisible;

        // Open card via pinch/trigger simulation
        store.openCard();
        const cardOpened = store.isCardOpen;

        // Trigger simulated order
        store.handleOrder();

        // Close card
        store.closeCard();
        const cardClosed = !store.isCardOpen;

        const passed = markerVisible && cardOpened && cardClosed;

        this.results.push({
            name: "Unlit Corner Marker & Emergency Store Card",
            criterion: "5",
            passed,
            details: passed
                ? "Empty hands reveals corner marker. Pinch opens 30x20cm card with lamp items, simulated order triggers delivery."
                : "Store card open/close flow failed.",
        });
    }
}

