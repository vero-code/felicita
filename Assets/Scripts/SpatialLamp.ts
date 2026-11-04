/**
 * SpatialLamp.ts
 * Interactive emergency battery lamp equipped with SIK Interactable & Manipulation.
 * Can be picked up with pinch-and-drag, snapped to surface hotspots, and activates its radial light zone.
 * Satisfies Done Criteria 2, 3, & 4.
 */

import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { InteractableManipulation } from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation";
import { GeometryHelper } from "./GeometryHelper";
import { LightCoverageZone } from "./LightCoverageZone";
import { PlacementSpot } from "./PlacementSpot";

@component
export class SpatialLamp extends BaseScriptComponent {
    public lampId: string = "lamp_default";
    public displayName: string = "Battery Lamp";
    public lumens: number = 400;
    public coverageRadius: number = 220; // in cm
    public lightColor: vec4 = new vec4(1.0, 0.95, 0.75, 1.0);

    public isPlaced: boolean = false;
    public isHeld: boolean = false;
    public placedSpot: PlacementSpot | null = null;
    public restingPosition: vec3 = vec3.zero();

    public coverageZone: LightCoverageZone | null = null;
    private pointLight: LightSource | null = null;
    private interactable: Interactable | null = null;
    private manipulation: InteractableManipulation | null = null;
    private lampMeshRoot: SceneObject | null = null;

    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => this.setupLamp());
    }

    public initializeConfig(
        id: string,
        name: string,
        lumens: number,
        coverageRadius: number,
        color: vec4,
        startPos: vec3
    ): void {
        this.lampId = id;
        this.displayName = name;
        this.lumens = lumens;
        this.coverageRadius = coverageRadius;
        this.lightColor = color;
        this.restingPosition = startPos;
        this.getTransform().setLocalPosition(startPos);
    }

    private setupLamp(): void {
        // Visual root
        this.lampMeshRoot = global.scene.createSceneObject("LampVisual");
        this.lampMeshRoot.setParent(this.sceneObject);
        this.buildLampVisuals();

        // 3D Physics Collider for SIK interaction
        const collider = this.sceneObject.createComponent("Physics.ColliderComponent") as ColliderComponent;
        const boxShape = Shape.createBoxShape();
        boxShape.size = new vec3(22, 32, 22);
        collider.shape = boxShape;

        // SIK Interactable
        this.interactable = this.sceneObject.createComponent(Interactable.getTypeName()) as Interactable;
        if (this.interactable) {
            this.interactable.colliders = [collider];
        }

        // SIK Manipulation (enables direct 3D pinch & drag)
        this.manipulation = this.sceneObject.createComponent(InteractableManipulation.getTypeName()) as InteractableManipulation;

        // Radial light coverage zone
        const zoneObj = global.scene.createSceneObject(`${this.lampId}_CoverageZone`);
        zoneObj.setParent(this.sceneObject);
        this.coverageZone = zoneObj.createComponent(LightCoverageZone.getTypeName()) as LightCoverageZone;
        this.coverageZone.initializeZone(this.coverageRadius, this.lightColor);

        // Point light emitter
        const lightObj = global.scene.createSceneObject(`${this.lampId}_PointLight`);
        lightObj.setParent(this.sceneObject);
        lightObj.getTransform().setLocalPosition(new vec3(0, 12, 0));
        this.pointLight = lightObj.createComponent("Component.LightSource") as LightSource;
        if (this.pointLight) {
            this.pointLight.lightType = LightType.Point;
            this.pointLight.color = new vec3(this.lightColor.x, this.lightColor.y, this.lightColor.z);
            this.pointLight.falloffType = FalloffType.Quadratic;
            this.pointLight.falloffRange = this.coverageRadius * 1.5;
            this.pointLight.intensity = 0.0; // Inactive initially
        }

        // Bind SIK interaction events
        this.bindEvents();
    }

    private buildLampVisuals(): void {
        if (!this.lampMeshRoot) return;

        if (this.lampId === "blue_lamp") {
            // Big Blue Emergency Lantern (400 lm)
            // Base cylinder
            const baseMesh = GeometryHelper.createCylinderMesh(6, 6, 16, [0.15, 0.45, 0.85, 1.0]);
            const baseMat = GeometryHelper.createMaterial(new vec4(0.15, 0.45, 0.85, 1.0));
            GeometryHelper.createVisualObject("Base", baseMesh, this.lampMeshRoot, new vec3(0, 3, 0), quat.quatIdentity(), vec3.one(), baseMat);

            // Glowing frosted light core
            const coreMesh = GeometryHelper.createCylinderMesh(5, 10, 16, [1.0, 0.95, 0.8, 0.9]);
            const coreMat = GeometryHelper.createMaterial(new vec4(1.0, 0.95, 0.8, 0.9));
            GeometryHelper.createVisualObject("Core", coreMesh, this.lampMeshRoot, new vec3(0, 11, 0), quat.quatIdentity(), vec3.one(), coreMat);

            // Top cap
            const capMesh = GeometryHelper.createCylinderMesh(6.2, 3, 16, [0.12, 0.38, 0.75, 1.0]);
            GeometryHelper.createVisualObject("Cap", capMesh, this.lampMeshRoot, new vec3(0, 17.5, 0), quat.quatIdentity(), vec3.one(), baseMat);

            // Arch handle
            const handleMesh = GeometryHelper.createBoxMesh(5, 0.8, 0.8, [0.3, 0.35, 0.4, 1.0]);
            GeometryHelper.createVisualObject("Handle", handleMesh, this.lampMeshRoot, new vec3(0, 21, 0), quat.quatIdentity(), vec3.one(), baseMat);

        } else if (this.lampId === "white_lantern") {
            // White Lantern with Handle (250 lm)
            const bodyMesh = GeometryHelper.createCylinderMesh(4.8, 14, 16, [0.95, 0.95, 0.92, 1.0]);
            const bodyMat = GeometryHelper.createMaterial(new vec4(0.95, 0.95, 0.92, 1.0));
            GeometryHelper.createVisualObject("Body", bodyMesh, this.lampMeshRoot, new vec3(0, 7, 0), quat.quatIdentity(), vec3.one(), bodyMat);

            const handleMesh = GeometryHelper.createBoxMesh(4, 0.6, 0.6, [0.2, 0.2, 0.22, 1.0]);
            GeometryHelper.createVisualObject("Handle", handleMesh, this.lampMeshRoot, new vec3(0, 16, 0), quat.quatIdentity(), vec3.one(), bodyMat);

        } else if (this.lampId === "flashlight") {
            // Sleek Flashlight (150 lm)
            const handleMesh = GeometryHelper.createCylinderMesh(2.2, 16, 16, [0.22, 0.25, 0.28, 1.0]);
            const handleMat = GeometryHelper.createMaterial(new vec4(0.22, 0.25, 0.28, 1.0));
            GeometryHelper.createVisualObject("Handle", handleMesh, this.lampMeshRoot, new vec3(0, 8, 0), quat.quatIdentity(), vec3.one(), handleMat);

            const headMesh = GeometryHelper.createCylinderMesh(3.5, 4, 16, [0.8, 0.3, 0.1, 1.0]);
            const headMat = GeometryHelper.createMaterial(new vec4(0.8, 0.3, 0.1, 1.0));
            GeometryHelper.createVisualObject("Head", headMesh, this.lampMeshRoot, new vec3(0, 18, 0), quat.quatIdentity(), vec3.one(), headMat);

        } else {
            // Emergency Candle (50 lm)
            const waxMesh = GeometryHelper.createCylinderMesh(2.5, 9, 16, [0.92, 0.88, 0.80, 1.0]);
            const waxMat = GeometryHelper.createMaterial(new vec4(0.92, 0.88, 0.80, 1.0));
            GeometryHelper.createVisualObject("Wax", waxMesh, this.lampMeshRoot, new vec3(0, 4.5, 0), quat.quatIdentity(), vec3.one(), waxMat);

            // Amber flame
            const flameMesh = GeometryHelper.createBoxMesh(0.8, 1.6, 0.8, [1.0, 0.7, 0.1, 1.0]);
            const flameMat = GeometryHelper.createMaterial(new vec4(1.0, 0.7, 0.1, 1.0), true);
            GeometryHelper.createVisualObject("Flame", flameMesh, this.lampMeshRoot, new vec3(0, 10.5, 0), quat.quatIdentity(), vec3.one(), flameMat);
        }
    }

    private bindEvents(): void {
        if (this.interactable) {
            this.interactable.onTriggerStart.add(() => this.handlePickUp());
            this.interactable.onTriggerEnd.add(() => this.handleRelease());
        }

        if (this.manipulation) {
            this.manipulation.onManipulationStart.add(() => this.handlePickUp());
            this.manipulation.onManipulationEnd.add(() => this.handleRelease());
        }
    }

    public handlePickUp(): void {
        if (this.isHeld) return;
        this.isHeld = true;
        print(`[SpatialLamp] Picked up lamp: ${this.displayName} (${this.lumens} lm)`);

        // If previously placed, release from that spot
        if (this.isPlaced && this.placedSpot) {
            this.placedSpot.markVacant();
            this.placedSpot = null;
            this.isPlaced = false;
        }

        // Notify app
        const app = (global as any).FelicitaAppInstance;
        if (app && app.onLampPickedUp) {
            app.onLampPickedUp(this);
        }
    }

    public handleRelease(): void {
        if (!this.isHeld) return;
        this.isHeld = false;
        print(`[SpatialLamp] Released lamp: ${this.displayName}`);

        const app = (global as any).FelicitaAppInstance;
        const nearestSpot = app ? app.findNearestAvailableSpot(this.getTransform().getWorldPosition(), 40.0) : null;

        if (nearestSpot) {
            this.snapToSpot(nearestSpot);
            if (app && app.onLampPlaced) {
                app.onLampPlaced(this, nearestSpot);
            }
        } else {
            // Not near any valid hotspot; return to resting position
            this.getTransform().setLocalPosition(this.restingPosition);
            if (app && app.onLampDropped) {
                app.onLampDropped(this);
            }
        }
    }

    public snapToSpot(spot: PlacementSpot): void {
        this.placedSpot = spot;
        this.isPlaced = true;
        spot.markOccupied();

        // Snap position exactly onto spot with slight vertical offset for lamp base
        const spotPos = spot.anchorPosition;
        this.getTransform().setLocalPosition(new vec3(spotPos.x, spotPos.y, spotPos.z));

        // Activate radial light coverage zone
        if (this.coverageZone) {
            this.coverageZone.activate();
        }

        // Turn on physical point light emitter
        if (this.pointLight) {
            this.pointLight.intensity = Math.max(0.3, this.lumens / 350.0);
        }

        print(`[SpatialLamp] Snapped ${this.displayName} to hotspot: ${spot.spotName}`);
    }
}

