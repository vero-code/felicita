/**
 * LightStatusHUD.ts
 * Floating high-contrast status display showing total lumens, coverage percentage,
 * and contextual guidance for Specs AR additive displays.
 * Positioned comfortably in user view at eye level (y = 65cm, z = -105cm).
 */

import { GeometryHelper } from "./GeometryHelper";

@component
export class LightStatusHUD extends BaseScriptComponent {
    private titleText: Text | null = null;
    private lumenText: Text | null = null;
    private coverageText: Text | null = null;
    private guideText: Text | null = null;
    private backPlate: SceneObject | null = null;

    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => this.setupHUD());
    }

    private setupHUD(): void {
        // Position at eye level facing the user: centered above the table area
        this.getTransform().setLocalPosition(new vec3(0, 68, -100));

        // Semi-translucent dark slate backing plate for AR readability
        const plateMesh = GeometryHelper.createBoxMesh(36, 14, 0.4, [0.12, 0.14, 0.18, 0.75]);
        const plateMat = GeometryHelper.createMaterial(new vec4(0.12, 0.14, 0.18, 0.75), false);
        this.backPlate = GeometryHelper.createVisualObject(
            "HUD_BackPlate",
            plateMesh,
            this.sceneObject,
            new vec3(0, 0, -0.5),
            quat.quatIdentity(),
            vec3.one(),
            plateMat
        );

        // Header Title
        const titleObj = global.scene.createSceneObject("HUD_Title");
        titleObj.setParent(this.sceneObject);
        titleObj.getTransform().setLocalPosition(new vec3(0, 4.8, 0.2));
        this.titleText = titleObj.createComponent("Component.Text") as Text;
        this.titleText.text = "FELICITA  SPATIAL LIGHT PLANNER";
        this.titleText.size = 18;
        this.titleText.textFill.color = new vec4(0.5, 0.85, 1.0, 1.0); // Light cyan

        // Lumen readout
        const lumenObj = global.scene.createSceneObject("HUD_LumenOutput");
        lumenObj.setParent(this.sceneObject);
        lumenObj.getTransform().setLocalPosition(new vec3(0, 1.8, 0.2));
        this.lumenText = lumenObj.createComponent("Component.Text") as Text;
        this.lumenText.text = "0 / 850 Lumens";
        this.lumenText.size = 26;
        this.lumenText.textFill.color = new vec4(1.0, 0.95, 0.4, 1.0); // Bright warm amber

        // Coverage readout
        const coverageObj = global.scene.createSceneObject("HUD_Coverage");
        coverageObj.setParent(this.sceneObject);
        coverageObj.getTransform().setLocalPosition(new vec3(0, -1.2, 0.2));
        this.coverageText = coverageObj.createComponent("Component.Text") as Text;
        this.coverageText.text = "Room Coverage: 0% of 20 m²";
        this.coverageText.size = 18;
        this.coverageText.textFill.color = new vec4(0.9, 0.95, 1.0, 1.0); // Bright white

        // Contextual guide message
        const guideObj = global.scene.createSceneObject("HUD_Guide");
        guideObj.setParent(this.sceneObject);
        guideObj.getTransform().setLocalPosition(new vec3(0, -4.2, 0.2));
        this.guideText = guideObj.createComponent("Component.Text") as Text;
        this.guideText.text = "Blackout active. Pinch a battery lamp to illuminate.";
        this.guideText.size = 14;
        this.guideText.textFill.color = new vec4(0.75, 0.82, 0.90, 1.0); // Subtle light grey-blue
    }

    public updateReadout(
        currentLumens: number,
        maxLumens: number,
        coverageRatio: number,
        guideMessage: string
    ): void {
        const percent = Math.round(coverageRatio * 100);

        if (this.lumenText) {
            this.lumenText.text = `+${currentLumens} / ${maxLumens} Lumens`;
            if (currentLumens > 0) {
                this.lumenText.textFill.color = new vec4(1.0, 0.95, 0.35, 1.0);
            }
        }

        if (this.coverageText) {
            this.coverageText.text = `Room Coverage: ${percent}% of 20 m²`;
        }

        if (this.guideText) {
            this.guideText.text = guideMessage;
        }
    }
}

