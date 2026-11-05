import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import { findInteractableByName } from "Leaf.lspkg/Interactors/InteractableUtils"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils"

@component
export class Criterion3PlaceLampSnapsAndUpdatesLumensScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new DefaultLeafInteractor()
    await sleep(400)

    const resetBtn = findInteractableByName("ResetRoomButton")
    if (resetBtn) {
      await interactor.trigger(resetBtn)
      await sleep(250)
    }

    const lumenTextObj = findSceneObjectByName("LumenStatusText")!
    const lumenTextComp = lumenTextObj.getComponent("Component.Text") as Text
    expect(lumenTextComp.text, "Initial lumen readout").toBe("+0 lumens / 20 m² covered (0/4 spots)")

    // Pinch Lamp_BigBlue (400 lm)
    const bigBlueInteractable = findInteractableByName("Lamp_BigBlue")!
    await interactor.trigger(bigBlueInteractable)
    await sleep(250)

    // Place Lamp_BigBlue onto Hotspot_TableCenter
    const tableSpotInteractable = findInteractableByName("Hotspot_TableCenter")!
    await interactor.trigger(tableSpotInteractable)
    await sleep(300)

    // 1. Verify lamp snapped to target spot's X/Z position
    const lampSO = findSceneObjectByName("Lamp_BigBlue")!
    const spotSO = findSceneObjectByName("Hotspot_TableCenter")!
    const lampPos = lampSO.getTransform().getWorldPosition()
    const spotPos = spotSO.getTransform().getWorldPosition()
    const dx = Math.abs(lampPos.x - spotPos.x)
    const dz = Math.abs(lampPos.z - spotPos.z)
    expect(dx < 0.5 && dz < 0.5, "Lamp should snap to Hotspot_TableCenter X/Z coordinates").toBe(true)

    // 2. Verify light coverage zone is activated and subtle dot is hidden
    const lightZone = findSceneObjectByName("Hotspot_TableCenter_LightZone")!
    const spotDot = findSceneObjectByName("Hotspot_TableCenter_Dot")!
    expect(lightZone.enabled, "Hotspot_TableCenter_LightZone should be enabled").toBe(true)
    expect(spotDot.enabled, "Hotspot_TableCenter_Dot should be hidden when occupied").toBe(false)

    // 3. Verify room lumen counter updated to +400 lumens
    expect(lumenTextComp.text, "Updated lumen readout after placing 400 lm lamp").toBe(
      "+400 lumens / 20 m² covered (1/4 spots)"
    )
  }
}
