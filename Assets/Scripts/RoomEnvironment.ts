/**
 * RoomEnvironment.ts
 * Builds the simulated 3D dark room environment with furniture props (table, shelf, chair, floor)
 * representing a ~20 m² room during an emergency blackout.
 * Satisfies Done Criterion 1.
 */

import { GeometryHelper } from "./GeometryHelper";

@component
export class RoomEnvironment extends BaseScriptComponent {
    public roomRoot: SceneObject | null = null;
    public tableTopObject: SceneObject | null = null;
    public shelfObject: SceneObject | null = null;
    public chairObject: SceneObject | null = null;
    public floorObject: SceneObject | null = null;

    private ambientLight: LightSource | null = null;
    private targetAmbientIntensity: number = 0.05;
    private currentAmbientIntensity: number = 0.05;

    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => this.initializeRoom());
        this.createEvent("UpdateEvent").bind(() => this.onUpdate());
    }

    private initializeRoom(): void {
        print("[RoomEnvironment] Initializing simulated dark room...");
        this.roomRoot = global.scene.createSceneObject("SimulatedDarkRoom");

        this.buildFloor();
        this.buildTable();
        this.buildShelf();
        this.buildChair();
        this.buildPerimeterBounds();
        this.setupLighting();
    }

    private buildFloor(): void {
        // Room floor: 450 x 450 cm (approx 20 m²) at y = -80 cm
        const floorMesh = GeometryHelper.createBoxMesh(225, 1, 225, [0.10, 0.11, 0.14, 1.0]);
        const floorMat = GeometryHelper.createMaterial(new vec4(0.10, 0.11, 0.14, 1.0));
        this.floorObject = GeometryHelper.createVisualObject(
            "RoomFloor_20sqm",
            floorMesh,
            this.roomRoot,
            new vec3(0, -80, -120),
            quat.quatIdentity(),
            vec3.one(),
            floorMat
        );
    }

    private buildTable(): void {
        const tableRoot = global.scene.createSceneObject("TableProp");
        tableRoot.setParent(this.roomRoot);

        // Table top: 120cm wide x 70cm deep x 4cm thick, top surface at y = 35cm
        const tableTopMesh = GeometryHelper.createBoxMesh(60, 2, 35, [0.24, 0.18, 0.14, 1.0]);
        const tableMat = GeometryHelper.createMaterial(new vec4(0.24, 0.18, 0.14, 1.0));
        this.tableTopObject = GeometryHelper.createVisualObject(
            "TableTop",
            tableTopMesh,
            tableRoot,
            new vec3(0, 33, -120),
            quat.quatIdentity(),
            vec3.one(),
            tableMat
        );

        // 4 Table legs: 4cm x 4cm x 110cm down to floor at y = -80cm
        const legMesh = GeometryHelper.createBoxMesh(2, 56, 2, [0.18, 0.14, 0.11, 1.0]);
        const legMat = GeometryHelper.createMaterial(new vec4(0.18, 0.14, 0.11, 1.0));
        const legY = -23; // centered between 33 and -80
        const legX = 55, legZ = 30;

        GeometryHelper.createVisualObject("Leg_FL", legMesh, tableRoot, new vec3(-legX, legY, -120 + legZ), quat.quatIdentity(), vec3.one(), legMat);
        GeometryHelper.createVisualObject("Leg_FR", legMesh, tableRoot, new vec3(legX, legY, -120 + legZ), quat.quatIdentity(), vec3.one(), legMat);
        GeometryHelper.createVisualObject("Leg_BL", legMesh, tableRoot, new vec3(-legX, legY, -120 - legZ), quat.quatIdentity(), vec3.one(), legMat);
        GeometryHelper.createVisualObject("Leg_BR", legMesh, tableRoot, new vec3(legX, legY, -120 - legZ), quat.quatIdentity(), vec3.one(), legMat);
    }

    private buildShelf(): void {
        const shelfRoot = global.scene.createSceneObject("ShelfProp");
        shelfRoot.setParent(this.roomRoot);
        this.shelfObject = shelfRoot;

        const shelfMat = GeometryHelper.createMaterial(new vec4(0.20, 0.22, 0.26, 1.0));
        const shelfBoardMesh = GeometryHelper.createBoxMesh(40, 1.5, 15, [0.22, 0.24, 0.28, 1.0]);

        // 3 Shelf tiers: lower (y = 5cm), middle (y = 45cm), top (y = 80cm)
        const posX = -115;
        const posZ = -135;

        GeometryHelper.createVisualObject("Shelf_Tier1", shelfBoardMesh, shelfRoot, new vec3(posX, 5, posZ), quat.quatIdentity(), vec3.one(), shelfMat);
        GeometryHelper.createVisualObject("Shelf_Tier2", shelfBoardMesh, shelfRoot, new vec3(posX, 45, posZ), quat.quatIdentity(), vec3.one(), shelfMat);
        GeometryHelper.createVisualObject("Shelf_Tier3_Top", shelfBoardMesh, shelfRoot, new vec3(posX, 80, posZ), quat.quatIdentity(), vec3.one(), shelfMat);

        // Side upright supports
        const supportMesh = GeometryHelper.createBoxMesh(1.5, 80, 15, [0.15, 0.17, 0.20, 1.0]);
        GeometryHelper.createVisualObject("Shelf_SupportL", supportMesh, shelfRoot, new vec3(posX - 38.5, 0, posZ), quat.quatIdentity(), vec3.one(), shelfMat);
        GeometryHelper.createVisualObject("Shelf_SupportR", supportMesh, shelfRoot, new vec3(posX + 38.5, 0, posZ), quat.quatIdentity(), vec3.one(), shelfMat);
    }

    private buildChair(): void {
        const chairRoot = global.scene.createSceneObject("ChairProp");
        chairRoot.setParent(this.roomRoot);
        this.chairObject = chairRoot;

        const chairMat = GeometryHelper.createMaterial(new vec4(0.25, 0.20, 0.18, 1.0));
        // Seat at y = -25cm
        const seatMesh = GeometryHelper.createBoxMesh(20, 2, 20, [0.25, 0.20, 0.18, 1.0]);
        const posX = 75;
        const posZ = -120;

        GeometryHelper.createVisualObject("Chair_Seat", seatMesh, chairRoot, new vec3(posX, -25, posZ), quat.quatIdentity(), vec3.one(), chairMat);

        // Backrest
        const backrestMesh = GeometryHelper.createBoxMesh(20, 22, 2, [0.22, 0.18, 0.16, 1.0]);
        GeometryHelper.createVisualObject("Chair_Backrest", backrestMesh, chairRoot, new vec3(posX, -3, posZ + 18), quat.quatIdentity(), vec3.one(), chairMat);

        // 4 Chair legs down to -80cm
        const chairLegMesh = GeometryHelper.createBoxMesh(1.5, 27, 1.5, [0.18, 0.15, 0.13, 1.0]);
        GeometryHelper.createVisualObject("Chair_LegFL", chairLegMesh, chairRoot, new vec3(posX - 18, -52, posZ - 18), quat.quatIdentity(), vec3.one(), chairMat);
        GeometryHelper.createVisualObject("Chair_LegFR", chairLegMesh, chairRoot, new vec3(posX + 18, -52, posZ - 18), quat.quatIdentity(), vec3.one(), chairMat);
        GeometryHelper.createVisualObject("Chair_LegBL", chairLegMesh, chairRoot, new vec3(posX - 18, -52, posZ + 18), quat.quatIdentity(), vec3.one(), chairMat);
        GeometryHelper.createVisualObject("Chair_LegBR", chairLegMesh, chairRoot, new vec3(posX + 18, -52, posZ + 18), quat.quatIdentity(), vec3.one(), chairMat);
    }

    private buildPerimeterBounds(): void {
        // Subtle wall edge frames indicating room perimeter in dark blackout
        const frameMat = GeometryHelper.createMaterial(new vec4(0.18, 0.20, 0.25, 0.4), false);
        const wallNorthMesh = GeometryHelper.createBoxMesh(225, 70, 1, [0.12, 0.13, 0.17, 0.4]);
        GeometryHelper.createVisualObject("Wall_North", wallNorthMesh, this.roomRoot, new vec3(0, -10, -250), quat.quatIdentity(), vec3.one(), frameMat);

        const wallWestMesh = GeometryHelper.createBoxMesh(1, 70, 225, [0.12, 0.13, 0.17, 0.4]);
        GeometryHelper.createVisualObject("Wall_West", wallWestMesh, this.roomRoot, new vec3(-220, -10, -120), quat.quatIdentity(), vec3.one(), frameMat);

        const wallEastMesh = GeometryHelper.createBoxMesh(1, 70, 225, [0.12, 0.13, 0.17, 0.4]);
        GeometryHelper.createVisualObject("Wall_East", wallEastMesh, this.roomRoot, new vec3(220, -10, -120), quat.quatIdentity(), vec3.one(), frameMat);
    }

    private setupLighting(): void {
        // Find existing ambient light or create one
        const count = global.scene.getRootObjectsCount();
        for (let i = 0; i < count; i++) {
            const root = global.scene.getRootObject(i);
            const light = root.getComponent("Component.LightSource") as LightSource;
            if (light) {
                this.ambientLight = light;
                break;
            }
        }

        if (!this.ambientLight) {
            const lightObj = global.scene.createSceneObject("FelicitaAmbientLight");
            this.ambientLight = lightObj.createComponent("Component.LightSource") as LightSource;
        }

        if (this.ambientLight) {
            this.ambientLight.intensity = this.currentAmbientIntensity;
            this.ambientLight.color = new vec3(0.9, 0.88, 0.85);
        }
    }

    public setRoomIlluminationLevel(intensityRatio: number): void {
        // Intensity smoothly ranges from 0.05 (dark blackout) to 0.85 (fully illuminated)
        this.targetAmbientIntensity = 0.05 + Math.min(1.0, Math.max(0.0, intensityRatio)) * 0.80;
    }

    public getRoomIlluminationLevel(): number {
        return this.currentAmbientIntensity;
    }

    private onUpdate(): void {
        // Smoothly interpolate ambient intensity for pleasing blackout recovery transition
        const dt = getDeltaTime();
        this.currentAmbientIntensity += (this.targetAmbientIntensity - this.currentAmbientIntensity) * Math.min(1.0, dt * 3.0);
        if (this.ambientLight) {
            this.ambientLight.intensity = this.currentAmbientIntensity;
        }
    }
}

