/**
 * FelicitaApp.ts
 * Main Experience Orchestrator for Felicita - Spatial Light Planner on Specs.
 * Spawns and manages the simulated 20 m² dark room, battery lamps, placement hotspots,
 * additive illumination calculations, floating HUD, and emergency ordering card.
 * Satisfies all Done Criteria (1 through 5).
 */

import { EmergencyStoreCard } from "./EmergencyStoreCard";
import { LightStatusHUD } from "./LightStatusHUD";
import { PlacementSpot } from "./PlacementSpot";
import { RoomEnvironment } from "./RoomEnvironment";
import { SpatialLamp } from "./SpatialLamp";

@component
export class FelicitaApp extends BaseScriptComponent {
    public static instance: FelicitaApp | null = null;

    public roomEnvironment: RoomEnvironment | null = null;
    public statusHUD: LightStatusHUD | null = null;
    public emergencyStore: EmergencyStoreCard | null = null;

    public lamps: SpatialLamp[] = [];
    public spots: PlacementSpot[] = [];

    public totalPlacedLumens: number = 0;
    public readonly maxPossibleLumens: number = 850;
    public roomCoverageRatio: number = 0;
    public isHoldingLamp: boolean = false;

    public static getInstance(): FelicitaApp | null {
        return FelicitaApp.instance;
    }

    onAwake(): void {
        FelicitaApp.instance = this;
        (global as any).FelicitaAppInstance = this;

        this.createEvent("OnStartEvent").bind(() => this.bootstrapExperience());
    }

    private bootstrapExperience(): void {
        print("[FelicitaApp] Bootstrapping Felicita - Spatial Light Planner for SPECS...");

        // 1. Room Environment (Simulated 20 m² dark room with furniture props)
        const roomObj = global.scene.createSceneObject("FelicitaRoomEnvironment");
        roomObj.setParent(this.sceneObject);
        this.roomEnvironment = roomObj.createComponent(RoomEnvironment.getTypeName()) as RoomEnvironment;

        // 2. Spatial HUD
        const hudObj = global.scene.createSceneObject("FelicitaStatusHUD");
        hudObj.setParent(this.sceneObject);
        this.statusHUD = hudObj.createComponent(LightStatusHUD.getTypeName()) as LightStatusHUD;

        // 3. Recommended Placement Target Hotspots (on furniture and surfaces)
        this.spawnPlacementSpots();

        // 4. Battery Lamps (Emergency light sources)
        this.spawnBatteryLamps();

        // 5. Unlit Corner Marker & Emergency Store Card
        const storeObj = global.scene.createSceneObject("FelicitaEmergencyStore");
        storeObj.setParent(this.sceneObject);
        this.emergencyStore = storeObj.createComponent(EmergencyStoreCard.getTypeName()) as EmergencyStoreCard;

        print("[FelicitaApp] Experience successfully bootstrapped.");
    }

    private spawnPlacementSpots(): void {
        const spotConfigs = [
            {
                id: "spot_table_center",
                name: "Table Center Hotspot",
                pos: new vec3(0, 35, -120), // Resting on table top
            },
            {
                id: "spot_shelf_top",
                name: "Shelf Top Hotspot",
                pos: new vec3(-115, 82, -135), // Top of shelf
            },
            {
                id: "spot_table_edge",
                name: "Table Work Hotspot",
                pos: new vec3(40, 35, -115), // Table right edge
            },
            {
                id: "spot_floor_ambient",
                name: "Ambient Floor Hotspot",
                pos: new vec3(120, -78, -170), // Floor area
            },
        ];

        const spotsRoot = global.scene.createSceneObject("PlacementSpots");
        spotsRoot.setParent(this.sceneObject);

        for (const cfg of spotConfigs) {
            const spotObj = global.scene.createSceneObject(`Spot_${cfg.id}`);
            spotObj.setParent(spotsRoot);
            const spot = spotObj.createComponent(PlacementSpot.getTypeName()) as PlacementSpot;
            spot.initializeSpot(cfg.id, cfg.name, cfg.pos);
            this.spots.push(spot);
        }
    }

    private spawnBatteryLamps(): void {
        const lampConfigs = [
            {
                id: "blue_lamp",
                name: "Big Blue Lamp",
                lumens: 400,
                radius: 220,
                color: new vec4(1.0, 0.95, 0.70, 0.50), // Warm golden
                startPos: new vec3(-30, 35, -115), // Resting on table
            },
            {
                id: "white_lantern",
                name: "White Lantern",
                lumens: 250,
                radius: 170,
                color: new vec4(0.95, 0.95, 0.85, 0.45), // Warm white
                startPos: new vec3(-115, 47, -135), // Resting on shelf middle tier
            },
            {
                id: "flashlight",
                name: "Flashlight",
                lumens: 150,
                radius: 120,
                color: new vec4(0.90, 0.95, 1.0, 0.40), // Cool white
                startPos: new vec3(25, 35, -115), // Resting on table
            },
            {
                id: "candle",
                name: "Emergency Candle",
                lumens: 50,
                radius: 70,
                color: new vec4(1.0, 0.75, 0.35, 0.55), // Amber candle flame
                startPos: new vec3(-85, 47, -135), // Resting on shelf
            },
        ];

        const lampsRoot = global.scene.createSceneObject("BatteryLamps");
        lampsRoot.setParent(this.sceneObject);

        for (const cfg of lampConfigs) {
            const lampObj = global.scene.createSceneObject(`Lamp_${cfg.id}`);
            lampObj.setParent(lampsRoot);
            const lamp = lampObj.createComponent(SpatialLamp.getTypeName()) as SpatialLamp;
            lamp.initializeConfig(cfg.id, cfg.name, cfg.lumens, cfg.radius, cfg.color, cfg.startPos);
            this.lamps.push(lamp);
        }
    }

    public onLampPickedUp(lamp: SpatialLamp): void {
        this.isHoldingLamp = true;

        // Activate all vacant placement hotspots so user sees recommended placement targets
        for (const spot of this.spots) {
            spot.setActive(true);
        }

        // Hands are busy handling lamp -> hide distant corner marker
        if (this.emergencyStore) {
            this.emergencyStore.setHandsEmpty(false);
        }

        if (this.statusHUD) {
            this.statusHUD.updateReadout(
                this.totalPlacedLumens,
                this.maxPossibleLumens,
                this.roomCoverageRatio,
                `Holding ${lamp.displayName}. Release over a green hotspot to place.`
            );
        }
    }

    public onLampPlaced(lamp: SpatialLamp, spot: PlacementSpot): void {
        this.isHoldingLamp = false;

        // Deactivate highlight on remaining spots
        for (const s of this.spots) {
            s.setActive(false);
        }

        // Hands are free again
        if (this.emergencyStore) {
            this.emergencyStore.setHandsEmpty(true);
        }

        // Recalculate total additive lumens & coverage
        this.recalculateLighting();

        let guideMsg = `+${lamp.lumens} lm placed! Light zone expanded.`;
        if (this.totalPlacedLumens >= this.maxPossibleLumens) {
            guideMsg = "All lamps placed! Optimal 20 m² room illumination achieved.";
        }

        if (this.statusHUD) {
            this.statusHUD.updateReadout(
                this.totalPlacedLumens,
                this.maxPossibleLumens,
                this.roomCoverageRatio,
                guideMsg
            );
        }
    }

    public onLampDropped(lamp: SpatialLamp): void {
        this.isHoldingLamp = false;

        for (const spot of this.spots) {
            spot.setActive(false);
        }

        if (this.emergencyStore) {
            this.emergencyStore.setHandsEmpty(true);
        }

        if (this.statusHUD) {
            this.statusHUD.updateReadout(
                this.totalPlacedLumens,
                this.maxPossibleLumens,
                this.roomCoverageRatio,
                "Lamp released outside hotspot. Pinch again to reposition."
            );
        }
    }

    public recalculateLighting(): void {
        let placedLumens = 0;
        let cumulativeAreaSqM = 0;

        for (const lamp of this.lamps) {
            if (lamp.isPlaced) {
                placedLumens += lamp.lumens;
                // Area in m²: PI * (radius_in_m)^2
                const radiusM = lamp.coverageRadius / 100.0;
                cumulativeAreaSqM += Math.PI * radiusM * radiusM * 0.45; // factoring overlapping geometry
            }
        }

        this.totalPlacedLumens = placedLumens;
        this.roomCoverageRatio = Math.min(1.0, cumulativeAreaSqM / 20.0);

        // Additively increase room ambient lighting
        const illuminationRatio = placedLumens / this.maxPossibleLumens;
        if (this.roomEnvironment) {
            this.roomEnvironment.setRoomIlluminationLevel(illuminationRatio);
        }

        print(`[FelicitaApp] Additive light updated: ${placedLumens} lumens | ${(this.roomCoverageRatio * 100).toFixed(0)}% room coverage`);
    }

    public findNearestAvailableSpot(worldPos: vec3, maxDistance: number): PlacementSpot | null {
        let bestSpot: PlacementSpot | null = null;
        let bestDist = maxDistance;

        for (const spot of this.spots) {
            if (spot.isOccupied) continue;
            const dist = spot.anchorPosition.distance(worldPos);
            if (dist < bestDist) {
                bestDist = dist;
                bestSpot = spot;
            }
        }
        return bestSpot;
    }
}

