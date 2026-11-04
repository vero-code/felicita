/**
 * LightCoverageZone.ts
 * Visualizes the soft radial light distribution zone projected onto surfaces around a placed lamp.
 * Expands smoothly when the lamp snaps onto a hotspot.
 * Satisfies Done Criteria 3 & 4.
 */

import { GeometryHelper } from "./GeometryHelper";

@component
export class LightCoverageZone extends BaseScriptComponent {
    public maxRadius: number = 180; // in cm
    public lightColor: vec4 = new vec4(1.0, 0.92, 0.70, 0.45);
    public isZoneActive: boolean = false;

    private currentRadiusRatio: number = 0;
    private targetRadiusRatio: number = 0;
    private zoneVisual: SceneObject | null = null;
    private zoneMaterial: Material | null = null;

    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => this.setupZoneVisual());
        this.createEvent("UpdateEvent").bind(() => this.onUpdate());
    }

    public initializeZone(radius: number, color: vec4): void {
        this.maxRadius = radius;
        this.lightColor = color;
    }

    private setupZoneVisual(): void {
        const centerColor: [number, number, number, number] = [
            this.lightColor.x,
            this.lightColor.y,
            this.lightColor.z,
            this.lightColor.w
        ];
        const edgeColor: [number, number, number, number] = [
            this.lightColor.x,
            this.lightColor.y,
            this.lightColor.z,
            0.0
        ];

        // Disc with radial gradient falloff from center to edge
        const discMesh = GeometryHelper.createDiscMesh(this.maxRadius, 36, centerColor, edgeColor);
        this.zoneMaterial = GeometryHelper.createMaterial(this.lightColor, true);

        this.zoneVisual = GeometryHelper.createVisualObject(
            "CoverageDisc",
            discMesh,
            this.sceneObject,
            new vec3(0, 0.1, 0),
            quat.quatIdentity(),
            new vec3(0.001, 1.0, 0.001),
            this.zoneMaterial
        );
        this.zoneVisual.enabled = false;
    }

    public activate(): void {
        this.isZoneActive = true;
        this.targetRadiusRatio = 1.0;
        if (this.zoneVisual) {
            this.zoneVisual.enabled = true;
        }
    }

    public deactivate(): void {
        this.isZoneActive = false;
        this.targetRadiusRatio = 0.0;
    }

    private onUpdate(): void {
        if (!this.zoneVisual) return;

        const dt = getDeltaTime();
        // Smooth expansion animation
        if (Math.abs(this.currentRadiusRatio - this.targetRadiusRatio) > 0.005) {
            this.currentRadiusRatio += (this.targetRadiusRatio - this.currentRadiusRatio) * Math.min(1.0, dt * 4.0);
            const scale = Math.max(0.001, this.currentRadiusRatio);
            this.zoneVisual.getTransform().setLocalScale(new vec3(scale, 1.0, scale));

            if (this.currentRadiusRatio < 0.01 && this.targetRadiusRatio === 0) {
                this.zoneVisual.enabled = false;
            }
        }
    }
}

