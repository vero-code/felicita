/**
 * FelicitaMain — Main orchestrator component for Felicita - Spatial Light Planner.
 *
 * Owns:
 * - Lifecycle (onAwake, OnStartEvent, UpdateEvent)
 * - SIK Interactable & InteractableManipulation wiring on the 4 battery lamps, 4 placement hotspots, and dark corner marker
 * - Coordinating FelicitaState, FelicitaAudioController, room furniture brightness, and UI modules
 *
 * Expects @input:
 * - Authored references to UI modules (statusHud, emergencyStore), furniture meshes, lamp meshes, and hotspot meshes
 * - Settings: defaultRoomAreaSqM, snapDistanceCm, bigBlueLumens, whiteHandleLumens, gazeConeCosine, debugColliders
 *
 * Must not:
 * - Create raw Component.Text or import SpectaclesUIKit directly (Hard Rule 3)
 */

import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import { InteractableManipulation } from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"

import { FelicitaAudioController } from "./FelicitaAudioController"
import { FelicitaEmergencyStoreUI } from "./FelicitaEmergencyStoreUI"
import { FelicitaHotspotZoneMesh } from "./FelicitaHotspotZoneMesh"
import { FelicitaLampMesh } from "./FelicitaLampMesh"
import { FelicitaRoomFurnitureMesh } from "./FelicitaRoomFurnitureMesh"
import { FelicitaState } from "./FelicitaState"
import { FelicitaStatusHudUI } from "./FelicitaStatusHudUI"

interface LampRuntimeEntry {
  id: string
  meshComp: FelicitaLampMesh
  sceneObj: SceneObject
  homePos: vec3
  dragStartPos: vec3
  interactable: Interactable
  manipulation: InteractableManipulation
}

interface HotspotRuntimeEntry {
  id: string
  meshComp: FelicitaHotspotZoneMesh
  sceneObj: SceneObject
  interactable: Interactable
}

@component
export class FelicitaMain extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">FelicitaMain – Spatial Light Planner Orchestrator</span>')
  @ui.separator

  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @hint("Floating Room Light Status HUD UI module")
  statusHud!: FelicitaStatusHudUI

  @input
  @hint("Compact floating Emergency Store Card UI module (starts hidden)")
  emergencyStore!: FelicitaEmergencyStoreUI

  @input
  @hint("Simulated room table furniture mesh")
  roomTable!: FelicitaRoomFurnitureMesh

  @input
  @hint("Simulated room chair furniture mesh")
  roomChair!: FelicitaRoomFurnitureMesh

  @input
  @hint("Simulated room shelf furniture mesh")
  roomShelf!: FelicitaRoomFurnitureMesh

  @input
  @hint("Big Blue Lamp (400 lm) on table")
  lampBigBlue!: FelicitaLampMesh

  @input
  @hint("White Lamp with Handle (400 lm) on shelf")
  lampWhiteHandle!: FelicitaLampMesh

  @input
  @hint("Emergency Flashlight (250 lm) on table")
  lampFlashlight!: FelicitaLampMesh

  @input
  @hint("LED Emergency Candle (150 lm) on shelf")
  lampCandle!: FelicitaLampMesh

  @input
  @hint("Target placement hotspot on table center")
  hotspotTableCenter!: FelicitaHotspotZoneMesh

  @input
  @hint("Target placement hotspot on shelf front edge")
  hotspotShelfEdge!: FelicitaHotspotZoneMesh

  @input
  @hint("Target placement hotspot near chair side")
  hotspotChairSide!: FelicitaHotspotZoneMesh

  @input
  @hint("Target placement hotspot on lower floor front")
  hotspotFloorFront!: FelicitaHotspotZoneMesh

  @input
  @hint("Distant unlit corner interactive marker")
  darkCornerMarker!: FelicitaHotspotZoneMesh
  @ui.group_end

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @widget(new SliderWidget(10, 40, 5))
  @hint("Default room area in square meters shown in the status readout")
  defaultRoomAreaSqM: number = 20

  @input
  @widget(new SliderWidget(8, 90, 1))
  @hint("Maximum distance in centimeters for snapping a dragged lamp onto a surface hotspot")
  snapDistanceCm: number = 65

  @input
  @widget(new SliderWidget(100, 800, 50))
  @hint("Lumen rating for the Big Blue Lamp")
  bigBlueLumens: number = 400

  @input
  @widget(new SliderWidget(100, 800, 50))
  @hint("Lumen rating for the White Handle Lamp")
  whiteHandleLumens: number = 400

  @input
  @widget(new SliderWidget(0.3, 0.95, 0.05))
  @hint("Camera gaze cosine threshold for revealing the unlit dark corner marker with empty hands")
  gazeConeCosine: number = 0.65

  @input
  @hint("Enable wireframe rendering on all Physics.ColliderComponents for hit-zone debugging")
  debugColliders: boolean = false
  @ui.group_end

  private state = new FelicitaState()
  private audio!: FelicitaAudioController
  private lampEntries: LampRuntimeEntry[] = []
  private hotspotEntries: HotspotRuntimeEntry[] = []
  private darkCornerInteractable!: Interactable
  private isCornerHovered: boolean = false

  onAwake(): void {
    if (
      !this.statusHud ||
      !this.emergencyStore ||
      !this.lampBigBlue ||
      !this.lampWhiteHandle ||
      !this.lampFlashlight ||
      !this.lampCandle ||
      !this.hotspotTableCenter ||
      !this.hotspotShelfEdge ||
      !this.hotspotChairSide ||
      !this.hotspotFloorFront ||
      !this.darkCornerMarker
    ) {
      console.log("[FelicitaMain] ERROR: Required @input references not wired. Check Phase B.")
      return
    }

    this.state.roomAreaSqM = this.defaultRoomAreaSqM
    this.state.configureLumens(this.bigBlueLumens, this.whiteHandleLumens)
    this.audio = new FelicitaAudioController(this.sceneObject)

    this.setupLamps()
    this.setupHotspots()
    this.setupDarkCorner()

    this.createEvent("OnStartEvent").bind(() => this.onStart())
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())

    if (this.debugColliders) {
      this.setColliderDebugAll(this.sceneObject, true)
    }
  }

  private onStart(): void {
    // Bind UI events
    this.statusHud.onSelectArea.add((sqM: number) => {
      this.state.roomAreaSqM = sqM
      this.syncAllVisuals(`Room area set to ${sqM} m² — pinch a lamp to plan light coverage`)
    })

    this.statusHud.onResetRoom.add(() => {
      this.resetAllLamps()
    })

    this.emergencyStore.onOrderLamp.add(() => {
      this.state.orderedExtraLumens += 400
      this.syncAllVisuals("Express +400 lm emergency lantern ordered for unlit corner!")
    })

    this.emergencyStore.onCloseStore.add(() => {
      this.state.storeCardOpen = false
      this.syncAllVisuals("Store card closed — pinch a lamp to illuminate the room")
    })

    // Bind SIK events on lamps inside OnStartEvent (per specs-interaction-recipes §1)
    for (const entry of this.lampEntries) {
      entry.interactable.onTriggerStart.add(() => {
        this.onLampPinchStart(entry)
      })
      entry.interactable.onTriggerEnd.add(() => {
        this.onLampPinchRelease(entry)
      })
      entry.interactable.onTriggerEndOutside.add(() => {
        this.onLampPinchRelease(entry)
      })
    }

    // Bind SIK events on surface hotspots inside OnStartEvent
    for (const spot of this.hotspotEntries) {
      spot.interactable.onHoverEnter.add(() => {
        if (!this.state.isHandsEmpty() && spot.meshComp.highlightSO) {
          spot.meshComp.highlightSO.getTransform().setLocalScale(new vec3(1.22, 1.0, 1.22))
        }
      })
      spot.interactable.onHoverExit.add(() => {
        if (spot.meshComp.highlightSO) {
          spot.meshComp.highlightSO.getTransform().setLocalScale(new vec3(1.0, 1.0, 1.0))
        }
      })
      spot.interactable.onTriggerStart.add(() => {
        this.onHotspotPinched(spot)
      })
    }

    // Bind SIK events on dark corner marker inside OnStartEvent
    this.darkCornerInteractable.onHoverEnter.add(() => {
      this.isCornerHovered = true
    })
    this.darkCornerInteractable.onHoverExit.add(() => {
      this.isCornerHovered = false
    })
    this.darkCornerInteractable.onTriggerStart.add(() => {
      this.onDarkCornerPinched()
    })

    this.syncAllVisuals("Blackout mode: Pinch a lamp to reveal target placement spots")
  }

  private setupLamps(): void {
    const pairs: [string, FelicitaLampMesh, vec3][] = [
      ["big_blue", this.lampBigBlue, new vec3(15, 18, 15)],
      ["white_handle", this.lampWhiteHandle, new vec3(15, 18, 15)],
      ["flashlight", this.lampFlashlight, new vec3(13, 16, 13)],
      ["candle", this.lampCandle, new vec3(12, 15, 12)],
    ]

    for (const [id, comp, colSize] of pairs) {
      const so = comp.getSceneObject()
      const homePos = so.getTransform().getWorldPosition()

      const collider = so.createComponent("Physics.ColliderComponent") as ColliderComponent
      const box = Shape.createBoxShape()
      box.size = colSize
      collider.shape = box

      const interactable = so.createComponent(Interactable.getTypeName()) as Interactable
      interactable.targetingMode = 3 // Direct & Indirect

      const manipulation = so.createComponent(InteractableManipulation.getTypeName()) as InteractableManipulation
      manipulation.setCanTranslate(true)
      manipulation.setCanRotate(false)
      manipulation.setCanScale(false)

      this.lampEntries.push({
        id,
        meshComp: comp,
        sceneObj: so,
        homePos,
        dragStartPos: homePos,
        interactable,
        manipulation,
      })
    }
  }

  private setupHotspots(): void {
    const spots: [string, FelicitaHotspotZoneMesh][] = [
      ["table_center", this.hotspotTableCenter],
      ["shelf_edge", this.hotspotShelfEdge],
      ["chair_side", this.hotspotChairSide],
      ["floor_front", this.hotspotFloorFront],
    ]

    for (const [id, comp] of spots) {
      const so = comp.getSceneObject()
      const collider = so.createComponent("Physics.ColliderComponent") as ColliderComponent
      const box = Shape.createBoxShape()
      box.size = new vec3(18.0, 9.0, 18.0)
      collider.shape = box

      const interactable = so.createComponent(Interactable.getTypeName()) as Interactable
      interactable.targetingMode = 3

      this.hotspotEntries.push({
        id,
        meshComp: comp,
        sceneObj: so,
        interactable,
      })
    }
  }

  private setupDarkCorner(): void {
    const so = this.darkCornerMarker.getSceneObject()
    const collider = so.createComponent("Physics.ColliderComponent") as ColliderComponent
    const box = Shape.createBoxShape()
    box.size = new vec3(20.0, 16.0, 20.0)
    collider.shape = box

    this.darkCornerInteractable = so.createComponent(Interactable.getTypeName()) as Interactable
    this.darkCornerInteractable.targetingMode = 3
  }

  private onLampPinchStart(entry: LampRuntimeEntry): void {
    const spec = this.state.pickUpLamp(entry.id)
    if (!spec) return

    // Close store card immediately if a lamp is picked up
    this.emergencyStore.hideStoreCard()

    const curPos = entry.sceneObj.getTransform().getWorldPosition()
    // Lift slightly to give immediate visual pickup confirmation
    const liftedPos = new vec3(curPos.x, curPos.y + 2.2, curPos.z)
    entry.sceneObj.getTransform().setWorldPosition(liftedPos)
    entry.dragStartPos = liftedPos

    this.audio.playPickup()
    this.syncAllVisuals(
      `Holding ${spec.displayName} (+${spec.lumens} lm) — Drag or pinch a highlighted spot`
    )
  }

  private onLampPinchRelease(entry: LampRuntimeEntry): void {
    if (this.state.heldLampId !== entry.id) return

    const releasePos = entry.sceneObj.getTransform().getWorldPosition()
    const dx = releasePos.x - entry.dragStartPos.x
    const dz = releasePos.z - entry.dragStartPos.z
    const horizontalDragDelta = Math.sqrt(dx * dx + dz * dz)

    // Find closest unoccupied hotspot
    let bestSpot: HotspotRuntimeEntry | null = null
    let bestDist = Infinity
    for (const spot of this.hotspotEntries) {
      const spotState = this.state.hotspots[spot.id]
      if (spotState && spotState.occupiedByLampId === null) {
        const d = releasePos.distance(spot.sceneObj.getTransform().getWorldPosition())
        if (d < bestDist) {
          bestDist = d
          bestSpot = spot
        }
      }
    }

    // If the user horizontally dragged the lamp (> 3.5 cm) toward a hotspot within snapDistanceCm, snap to it
    if (bestSpot && horizontalDragDelta > 3.5 && bestDist <= this.snapDistanceCm) {
      this.snapLampToHotspot(entry, bestSpot)
    } else {
      // Quick pinch/pickup: keep the lamp picked up in hand so recommended target spots stay visible
      // and the user can pinch any highlighted target spot (or drag the lamp) to place it.
      const spec = this.state.lamps[entry.id]
      this.syncAllVisuals(
        `Picked up ${spec.displayName} (+${spec.lumens} lm) — Pinch a highlighted target spot to place`
      )
    }
  }

  private onHotspotPinched(spot: HotspotRuntimeEntry): void {
    const spotState = this.state.hotspots[spot.id]
    if (!spotState || spotState.occupiedByLampId !== null) return

    // If a lamp is currently held in hand, snap it to this hotspot
    let targetLamp: LampRuntimeEntry | undefined
    if (this.state.heldLampId) {
      targetLamp = this.lampEntries.find((l) => l.id === this.state.heldLampId)
    } else {
      // Fallback: if user pinches a hotspot directly, pick the first unplaced lamp
      targetLamp = this.lampEntries.find((l) => this.state.lamps[l.id].placedHotspotId === null)
      if (targetLamp) {
        this.state.pickUpLamp(targetLamp.id)
      }
    }

    if (targetLamp) {
      this.snapLampToHotspot(targetLamp, spot)
    }
  }

  private snapLampToHotspot(lamp: LampRuntimeEntry, spot: HotspotRuntimeEntry): void {
    const placed = this.state.placeLampOnHotspot(lamp.id, spot.id)
    if (!placed) return

    const spotPos = spot.sceneObj.getTransform().getWorldPosition()
    lamp.sceneObj.getTransform().setWorldPosition(new vec3(spotPos.x, spotPos.y + 0.35, spotPos.z))

    this.audio.playPlace()
    const spec = this.state.lamps[lamp.id]
    const spotSpec = this.state.hotspots[spot.id]
    this.syncAllVisuals(
      `Placed ${spec.displayName} on ${spotSpec.displayName} (+${spec.lumens} lumens activated)`
    )
  }

  private onDarkCornerPinched(): void {
    if (!this.state.isHandsEmpty()) {
      // If holding a lamp, drop/unhold first or ignore store card
      return
    }
    this.state.storeCardOpen = true
    this.emergencyStore.showStoreCard("Unlit corner targeted — order extra emergency lamp")
    this.audio.playStoreOpen()
    this.syncAllVisuals("Emergency Store opened: No lamp? Order delivery today")
  }

  private resetAllLamps(): void {
    this.state.reset()
    this.emergencyStore.hideStoreCard()
    for (const lamp of this.lampEntries) {
      lamp.sceneObj.getTransform().setWorldPosition(lamp.homePos)
    }
    this.syncAllVisuals("Room reset — Pinch a battery lamp to reveal optimal placement spots")
  }

  private onUpdate(): void {
    // Evaluate gaze toward unlit dark corner when hands are empty
    const handsEmpty = this.state.isHandsEmpty()
    let isGazingCorner = true
    try {
      const cam = WorldCameraFinderProvider.getInstance().getComponent()
      if (cam) {
        const camT = cam.getTransform()
        const camPos = camT.getWorldPosition()
        const camForward = camT.back // Lens Studio camera faces local -Z (back)
        const cornerPos = this.darkCornerMarker.getSceneObject().getTransform().getWorldPosition()
        const toCorner = cornerPos.sub(camPos).normalize()
        const dot = camForward.dot(toCorner)
        isGazingCorner = dot >= this.gazeConeCosine
      }
    } catch (_e) {
      isGazingCorner = true
    }

    this.darkCornerMarker.setDarkCornerState(handsEmpty, isGazingCorner || this.isCornerHovered)
  }

  private syncAllVisuals(guidanceMsg?: string): void {
    const lampHeld = !this.state.isHandsEmpty()

    // 1. Update each lamp mesh visual state
    for (const entry of this.lampEntries) {
      const spec = this.state.lamps[entry.id]
      const isThisHeld = this.state.heldLampId === entry.id
      const isPlaced = spec.placedHotspotId !== null
      entry.meshComp.setLampActiveState(isThisHeld, isPlaced)
    }

    // 2. Update each hotspot dot, highlight ring, and radial light coverage zone
    for (const spot of this.hotspotEntries) {
      const spotSpec = this.state.hotspots[spot.id]
      const occupiedLampId = spotSpec.occupiedByLampId
      const isOccupied = occupiedLampId !== null
      const zoneRadius = occupiedLampId ? this.state.lamps[occupiedLampId].zoneRadiusCm : undefined
      spot.meshComp.setHotspotState(lampHeld, isOccupied, zoneRadius)
    }

    // 3. Update room furniture illumination boost based on total lumens
    const totalLm = this.state.totalLumens()
    const boost01 = Math.min(1.0, totalLm / 1000.0)
    if (this.roomTable) this.roomTable.setIlluminationBoost(boost01)
    if (this.roomChair) this.roomChair.setIlluminationBoost(boost01)
    if (this.roomShelf) this.roomShelf.setIlluminationBoost(boost01)

    // 4. Push readout to Status HUD UI module
    this.statusHud.setIllumination(
      totalLm,
      this.state.roomAreaSqM,
      this.state.placedLampCount(),
      this.state.totalHotspotCount()
    )
    if (guidanceMsg) {
      this.statusHud.setGuidance(guidanceMsg)
    }
  }

  private setColliderDebugAll(obj: SceneObject, enable: boolean): void {
    const c = obj.getComponent("Physics.ColliderComponent") as ColliderComponent | null
    if (c) c.debugDrawEnabled = enable
    const b = obj.getComponent("Physics.BodyComponent") as ColliderComponent | null
    if (b) b.debugDrawEnabled = enable
    for (let i = 0; i < obj.getChildrenCount(); i++) {
      this.setColliderDebugAll(obj.getChild(i), enable)
    }
  }
}
