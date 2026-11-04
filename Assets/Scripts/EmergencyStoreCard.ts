/**
 * EmergencyStoreCard.ts
 * Interactive unlit corner marker and compact emergency lamp ordering card.
 * With empty hands, looking at/approaching the unlit corner reveals the interactive beacon.
 * Pinching it opens the floating emergency store card.
 * Satisfies Done Criterion 5.
 */

import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { GeometryHelper } from "./GeometryHelper";

@component
export class EmergencyStoreCard extends BaseScriptComponent {
    public isCardOpen: boolean = false;
    public isMarkerVisible: boolean = false;

    private markerObject: SceneObject | null = null;
    private markerInteractable: Interactable | null = null;
    private cardObject: SceneObject | null = null;
    private statusText: Text | null = null;
    private orderButtonInteractable: Interactable | null = null;
    private closeButtonInteractable: Interactable | null = null;

    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => this.setupVisuals());
        this.createEvent("UpdateEvent").bind(() => this.onUpdate());
    }

    private setupVisuals(): void {
        // Positioned in the distant unlit dark corner: (x = 160cm, y = 10cm, z = -200cm)
        this.getTransform().setLocalPosition(new vec3(160, 10, -200));

        // 1. Unlit Corner Marker Beacon
        this.markerObject = global.scene.createSceneObject("UnlitCornerMarker");
        this.markerObject.setParent(this.sceneObject);
        this.markerObject.getTransform().setLocalPosition(new vec3(0, 0, 0));

        // Pulsing amber warning icon
        const beaconMesh = GeometryHelper.createCylinderMesh(6, 2, 16, [1.0, 0.45, 0.1, 0.9]);
        const beaconMat = GeometryHelper.createMaterial(new vec4(1.0, 0.45, 0.1, 0.9), true);
        GeometryHelper.createVisualObject("BeaconDisc", beaconMesh, this.markerObject, new vec3(0, 0, 0), quat.quatIdentity(), vec3.one(), beaconMat);

        // Marker label
        const markerLabelObj = global.scene.createSceneObject("MarkerLabel");
        markerLabelObj.setParent(this.markerObject);
        markerLabelObj.getTransform().setLocalPosition(new vec3(0, 8, 0));
        const markerText = markerLabelObj.createComponent("Component.Text") as Text;
        markerText.text = "Dark Corner (0 lux)\n[ Pinch to Order Light ]";
        markerText.size = 16;
        markerText.textFill.color = new vec4(1.0, 0.6, 0.2, 1.0);

        // Collider & Interactable on marker
        const markerCollider = this.markerObject.createComponent("Physics.ColliderComponent") as ColliderComponent;
        const boxShape = Shape.createBoxShape();
        boxShape.size = new vec3(20, 20, 20);
        markerCollider.shape = boxShape;

        this.markerInteractable = this.markerObject.createComponent(Interactable.getTypeName()) as Interactable;
        if (this.markerInteractable) {
            this.markerInteractable.colliders = [markerCollider];
            this.markerInteractable.onTriggerStart.add(() => this.openCard());
        }

        // 2. Compact Emergency Store Card (30cm x 22cm floating card)
        this.cardObject = global.scene.createSceneObject("StoreCardPanel");
        this.cardObject.setParent(this.sceneObject);
        this.cardObject.getTransform().setLocalPosition(new vec3(0, 25, 10));

        // BackPlate
        const cardBackMesh = GeometryHelper.createBoxMesh(18, 13, 0.5, [0.10, 0.12, 0.16, 0.9]);
        const cardBackMat = GeometryHelper.createMaterial(new vec4(0.10, 0.12, 0.16, 0.9), false);
        GeometryHelper.createVisualObject("CardBacking", cardBackMesh, this.cardObject, new vec3(0, 0, -0.2), quat.quatIdentity(), vec3.one(), cardBackMat);

        // Title
        const titleObj = global.scene.createSceneObject("CardTitle");
        titleObj.setParent(this.cardObject);
        titleObj.getTransform().setLocalPosition(new vec3(0, 8.5, 0.2));
        const titleText = titleObj.createComponent("Component.Text") as Text;
        titleText.text = "EMERGENCY LAMP STORE";
        titleText.size = 18;
        titleText.textFill.color = new vec4(1.0, 0.85, 0.3, 1.0);

        // Subtitle / detected zone info
        const subObj = global.scene.createSceneObject("CardSubtitle");
        subObj.setParent(this.cardObject);
        subObj.getTransform().setLocalPosition(new vec3(0, 5.8, 0.2));
        const subText = subObj.createComponent("Component.Text") as Text;
        subText.text = "No light in this corner. Order instant delivery:";
        subText.size = 12;
        subText.textFill.color = new vec4(0.8, 0.85, 0.9, 1.0);

        // Items listing
        const itemsObj = global.scene.createSceneObject("CardItems");
        itemsObj.setParent(this.cardObject);
        itemsObj.getTransform().setLocalPosition(new vec3(0, 2.2, 0.2));
        const itemsText = itemsObj.createComponent("Component.Text") as Text;
        itemsText.text = "- 1000lm Ultra Power Beacon ($29)\n- 300lm Solar Camp Lantern ($15)";
        itemsText.size = 13;
        itemsText.textFill.color = new vec4(0.95, 0.95, 1.0, 1.0);

        // Status text / confirmation message
        const statusObj = global.scene.createSceneObject("CardStatus");
        statusObj.setParent(this.cardObject);
        statusObj.getTransform().setLocalPosition(new vec3(0, -2.5, 0.2));
        this.statusText = statusObj.createComponent("Component.Text") as Text;
        this.statusText.text = "Simulated delivery available";
        this.statusText.size = 12;
        this.statusText.textFill.color = new vec4(0.5, 0.9, 1.0, 1.0);

        // Order Button
        this.buildOrderButton();

        // Close Button
        this.buildCloseButton();

        // Card initially closed
        this.cardObject.enabled = false;
        this.isCardOpen = false;
        this.isMarkerVisible = true;
    }

    private buildOrderButton(): void {
        const btnObj = global.scene.createSceneObject("OrderButton");
        btnObj.setParent(this.cardObject);
        btnObj.getTransform().setLocalPosition(new vec3(-6, -7.5, 0.3));

        const btnMesh = GeometryHelper.createBoxMesh(6, 2.2, 0.4, [0.15, 0.65, 0.35, 1.0]);
        const btnMat = GeometryHelper.createMaterial(new vec4(0.15, 0.65, 0.35, 1.0));
        GeometryHelper.createVisualObject("BtnMesh", btnMesh, btnObj, vec3.zero(), quat.quatIdentity(), vec3.one(), btnMat);

        const lblObj = global.scene.createSceneObject("BtnLabel");
        lblObj.setParent(btnObj);
        lblObj.getTransform().setLocalPosition(new vec3(0, 0, 0.3));
        const lbl = lblObj.createComponent("Component.Text") as Text;
        lbl.text = "ORDER NOW";
        lbl.size = 14;
        lbl.textFill.color = new vec4(1, 1, 1, 1);

        const col = btnObj.createComponent("Physics.ColliderComponent") as ColliderComponent;
        const box = Shape.createBoxShape();
        box.size = new vec3(12, 4.4, 2);
        col.shape = box;

        this.orderButtonInteractable = btnObj.createComponent(Interactable.getTypeName()) as Interactable;
        if (this.orderButtonInteractable) {
            this.orderButtonInteractable.colliders = [col];
            this.orderButtonInteractable.onTriggerStart.add(() => this.handleOrder());
        }
    }

    private buildCloseButton(): void {
        const btnObj = global.scene.createSceneObject("CloseButton");
        btnObj.setParent(this.cardObject);
        btnObj.getTransform().setLocalPosition(new vec3(7, -7.5, 0.3));

        const btnMesh = GeometryHelper.createBoxMesh(4, 2.2, 0.4, [0.35, 0.38, 0.45, 1.0]);
        const btnMat = GeometryHelper.createMaterial(new vec4(0.35, 0.38, 0.45, 1.0));
        GeometryHelper.createVisualObject("BtnMesh", btnMesh, btnObj, vec3.zero(), quat.quatIdentity(), vec3.one(), btnMat);

        const lblObj = global.scene.createSceneObject("BtnLabel");
        lblObj.setParent(btnObj);
        lblObj.getTransform().setLocalPosition(new vec3(0, 0, 0.3));
        const lbl = lblObj.createComponent("Component.Text") as Text;
        lbl.text = "CLOSE";
        lbl.size = 14;
        lbl.textFill.color = new vec4(1, 1, 1, 1);

        const col = btnObj.createComponent("Physics.ColliderComponent") as ColliderComponent;
        const box = Shape.createBoxShape();
        box.size = new vec3(8, 4.4, 2);
        col.shape = box;

        this.closeButtonInteractable = btnObj.createComponent(Interactable.getTypeName()) as Interactable;
        if (this.closeButtonInteractable) {
            this.closeButtonInteractable.colliders = [col];
            this.closeButtonInteractable.onTriggerStart.add(() => this.closeCard());
        }
    }

    public openCard(): void {
        this.isCardOpen = true;
        if (this.cardObject) this.cardObject.enabled = true;
        if (this.markerObject) this.markerObject.enabled = false;
        if (this.statusText) {
            this.statusText.text = "Select item to dispatch delivery.";
            this.statusText.textFill.color = new vec4(0.5, 0.9, 1.0, 1.0);
        }
        print("[EmergencyStoreCard] Opened emergency lamp ordering card.");
    }

    public closeCard(): void {
        this.isCardOpen = false;
        if (this.cardObject) this.cardObject.enabled = false;
        if (this.markerObject) this.markerObject.enabled = this.isMarkerVisible;
        print("[EmergencyStoreCard] Closed emergency lamp store card.");
    }

    public handleOrder(): void {
        if (this.statusText) {
            this.statusText.text = "ORDER CONFIRMED!\nDrone delivery in 15 min.";
            this.statusText.textFill.color = new vec4(0.2, 1.0, 0.5, 1.0); // Bright emerald green
        }
        print("[EmergencyStoreCard] Placed simulated order for emergency lamp.");
    }

    public setHandsEmpty(empty: boolean): void {
        // Marker only appears when hands are empty and card is not already open
        this.isMarkerVisible = empty;
        if (this.markerObject && !this.isCardOpen) {
            this.markerObject.enabled = empty;
        }
        if (!empty && this.isCardOpen) {
            // Dismiss card if user picks up a lamp
            this.closeCard();
        }
    }

    private onUpdate(): void {
        if (!this.markerObject || !this.markerObject.enabled) return;

        // Subtle pulsing beacon effect on unlit marker
        const scale = 1.0 + Math.sin(getTime() * 4.0) * 0.12;
        this.markerObject.getTransform().setLocalScale(new vec3(scale, 1.0, scale));
    }
}

