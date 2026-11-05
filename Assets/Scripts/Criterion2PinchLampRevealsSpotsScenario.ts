import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import { findInteractableByName } from "Leaf.lspkg/Interactors/InteractableUtils"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils"

@component
export class Criterion2PinchLampRevealsSpotsScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new DefaultLeafInteractor()
    await sleep(400)

    const resetBtn = findInteractableByName("ResetRoomButton")
    if (resetBtn) {
      await interactor.trigger(resetBtn)
      await sleep(250)
    }

    const tableHighlight = findSceneObjectByName("Hotspot_TableCenter_Highlight")
    const shelfHighlight = findSceneObjectByName("Hotspot_ShelfEdge_Highlight")
    const chairHighlight = findSceneObjectByName("Hotspot_ChairSide_Highlight")
    const floorHighlight = findSceneObjectByName("Hotspot_FloorFront_Highlight")

    expect(tableHighlight !== undefined, "Hotspot_TableCenter_Highlight should exist").toBe(true)
    expect(shelfHighlight !== undefined, "Hotspot_ShelfEdge_Highlight should exist").toBe(true)
    expect(chairHighlight !== undefined, "Hotspot_ChairSide_Highlight should exist").toBe(true)
    expect(floorHighlight !== undefined, "Hotspot_FloorFront_Highlight should exist").toBe(true)

    // Before pinching a lamp, target spot highlights are hidden
    expect(tableHighlight!.enabled, "Table highlight should be hidden initially").toBe(false)
    expect(shelfHighlight!.enabled, "Shelf highlight should be hidden initially").toBe(false)

    // Pinch and pick up the Big Blue battery lamp
    const bigBlueLamp = findInteractableByName("Lamp_BigBlue")
    expect(bigBlueLamp !== undefined, "Lamp_BigBlue Interactable should exist").toBe(true)
    await interactor.trigger(bigBlueLamp!)
    await sleep(300)

    // Recommended target placement spots must now appear on room surfaces
    expect(tableHighlight!.enabled, "Table highlight should appear when lamp is held").toBe(true)
    expect(shelfHighlight!.enabled, "Shelf highlight should appear when lamp is held").toBe(true)
    expect(chairHighlight!.enabled, "Chair highlight should appear when lamp is held").toBe(true)
    expect(floorHighlight!.enabled, "Floor highlight should appear when lamp is held").toBe(true)

    // Lamp glow core should be active and subtle dot hidden while held
    const lampGlow = findSceneObjectByName("LampGlowCore", bigBlueLamp!.getSceneObject())
    const lampDot = findSceneObjectByName("LampSubtleDot", bigBlueLamp!.getSceneObject())
    expect(lampGlow !== undefined && lampGlow.enabled, "Held lamp glow core should be active").toBe(true)
    expect(lampDot !== undefined && !lampDot.enabled, "Held lamp subtle dot should hide on pickup").toBe(true)
  }
}
