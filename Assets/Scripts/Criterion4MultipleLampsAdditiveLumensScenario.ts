import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import { findInteractableByName } from "Leaf.lspkg/Interactors/InteractableUtils"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils"

@component
export class Criterion4MultipleLampsAdditiveLumensScenario extends Scenario {
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
    expect(lumenTextComp.text).toBe("+0 lumens / 20 m² covered (0/4 spots)")

    // Place Lamp 1: Big Blue Lamp (+400 lm) -> Hotspot_TableCenter
    await interactor.trigger(findInteractableByName("Lamp_BigBlue")!)
    await sleep(200)
    await interactor.trigger(findInteractableByName("Hotspot_TableCenter")!)
    await sleep(250)
    expect(lumenTextComp.text).toBe("+400 lumens / 20 m² covered (1/4 spots)")

    // Place Lamp 2: White Handle Lamp (+400 lm) -> Hotspot_ShelfEdge
    await interactor.trigger(findInteractableByName("Lamp_WhiteHandle")!)
    await sleep(200)
    await interactor.trigger(findInteractableByName("Hotspot_ShelfEdge")!)
    await sleep(250)
    expect(lumenTextComp.text).toBe("+800 lumens / 20 m² covered (2/4 spots)")

    // Place Lamp 3: Emergency Flashlight (+250 lm) -> Hotspot_FloorFront
    await interactor.trigger(findInteractableByName("Lamp_Flashlight")!)
    await sleep(200)
    await interactor.trigger(findInteractableByName("Hotspot_FloorFront")!)
    await sleep(250)
    expect(lumenTextComp.text).toBe("+1050 lumens / 20 m² covered (3/4 spots)")

    // Verify all 3 light zones are simultaneously active
    const tableZone = findSceneObjectByName("Hotspot_TableCenter_LightZone")!
    const shelfZone = findSceneObjectByName("Hotspot_ShelfEdge_LightZone")!
    const floorZone = findSceneObjectByName("Hotspot_FloorFront_LightZone")!
    expect(tableZone.enabled).toBe(true)
    expect(shelfZone.enabled).toBe(true)
    expect(floorZone.enabled).toBe(true)
  }
}
