/**
 * PlacementSpot.ts
 * Recommended target placement hotspot on room surfaces.
 * Inactive state: subtle 5 cm low-contrast grey dot.
 * Active state (when a lamp is held in hand): glowing pulsating green/cyan ring.
 * Satisfies Done Criteria 2 & 3.
 */

import { GeometryHelper } from "./GeometryHelper";

@component
export class PlacementSpot extends BaseScriptComponent {
    public spotId: string = "spot_0";
    public spotName: string = "Hotspot";
    public anchorPosition: vec3 = vec3.zero();
    public isOccupied: boolean = false;
    public isActive: boolean = false;

    private dotVisual: SceneObject | null = null;
    private ringVisual: SceneObject | null = null;
    private ringMaterial: Material | null = null;
    private pulseTimer: number = 0;

    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => this.setupVisuals());
        this.createEvent("UpdateEvent").bind(() => this.onUpdate());
    }

    public initializeSpot(id: string, name: string, position: vec3): void {
        this.spotId = id;
        this.spotName = name;
        this.anchorPosition = position;
        this.getTransform().setLocalPosition(position);
    }

    private setupVisuals(): void {
        // Base subtle dot: 5 cm diameter disc resting on the surface
        const dotMesh = GeometryHelper.createDiscMesh(2.5, 16, [0.4, 0.45, 0.5, 0.5], [0.3, 0.35, 0.4, 0.2]);
        const dotMat = GeometryHelper.createMaterial(new vec4(0.4, 0.45, 0.5, 0.5), false);
        this.dotVisual = GeometryHelper.createVisualObject(
            "BaseDot",
            dotMesh,
            this.sceneObject,
            new vec3(0, 0.2, 0),
            quat.quatIdentity(),
            vec3.one(),
            dotMat
        );

        // Active glowing ring / beacon: 14 cm diameter additive ring disc
        const ringMesh = GeometryHelper.createDiscMesh(7.0, 24, [0.2, 0.9, 0.6, 0.8], [0.1, 0.7, 0.4, 0.0]);
        this.ringMaterial = GeometryHelper.createMaterial(new vec4(0.2, 0.9, 0.6, 0.8), true);
        this.ringVisual = GeometryHelper.createVisualObject(
            "ActivePulseRing",
            ringMesh,
            this.sceneObject,
            new vec3(0, 0.3, 0),
            quat.quatIdentity(),
            vec3.one(),
            this.ringMaterial
        );
        this.ringVisual.enabled = false;
    }

    public setActive(active: boolean): void {
        if (this.isOccupied) {
            this.isActive = false;
            if (this.ringVisual) this.ringVisual.enabled = false;
            if (this.dotVisual) this.dotVisual.enabled = false;
            return;
        }

        this.isActive = active;
        if (this.ringVisual) {
            this.ringVisual.enabled = active;
        }
        if (this.dotVisual) {
            this.dotVisual.enabled = true;
        }
    }

    public markOccupied(): void {
        this.isOccupied = true;
        this.isActive = false;
        if (this.ringVisual) this.ringVisual.enabled = false;
        if (this.dotVisual) this.dotVisual.enabled = false;
    }

    public markVacant(): void {
        this.isOccupied = false;
        if (this.dotVisual) this.dotVisual.enabled = true;
    }

    private onUpdate(): void {
        if (!this.isActive || this.isOccupied) return;

        this.pulseTimer += getDeltaTime() * 4.0;
        const scaleFactor = 1.0 + Math.sin(this.pulseTimer) * 0.15;
        if (this.ringVisual) {
            this.ringVisual.getTransform().setLocalScale(new vec3(scaleFactor, 1.0, scaleFactor));
        }
    }
}

