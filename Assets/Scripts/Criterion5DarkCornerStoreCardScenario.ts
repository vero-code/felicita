import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import { findInteractableByName } from "Leaf.lspkg/Interactors/InteractableUtils"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils"

@component
export class Criterion5DarkCornerStoreCardScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new DefaultLeafInteractor()
    await sleep(400)

    const resetBtn = findInteractableByName("ResetRoomButton")
    if (resetBtn) {
      await interactor.trigger(resetBtn)
      await sleep(250)
    }

    const storeCard = findSceneObjectByName("EmergencyStoreCard")!
    expect(storeCard.enabled, "EmergencyStoreCard should start hidden").toBe(false)

    // Verify the dark corner interactive marker is revealed when gazing with empty hands
    const darkCornerHighlight = findSceneObjectByName("DarkCornerMarker_Highlight")!
    expect(darkCornerHighlight.enabled, "DarkCornerMarker_Highlight should be revealed with empty hands").toBe(true)

    // Pinch the unlit corner interactive marker
    const darkCornerInteractable = findInteractableByName("DarkCornerMarker")!
    await interactor.trigger(darkCornerInteractable)
    await sleep(300)

    // Verify the compact emergency lamp ordering card is now open and shows the headline
    expect(storeCard.enabled, "EmergencyStoreCard should open when dark corner marker is pinched").toBe(true)
    const titleObj = findSceneObjectByName("StoreTitleText", storeCard)!
    const titleTextComp = titleObj.getComponent("Component.Text") as Text
    expect(titleTextComp.text).toBe("No lamp? Order delivery today")

    // Also verify the Order Lamp button works inside the store card
    const orderBtn = findInteractableByName("OrderLampButton")!
    await interactor.trigger(orderBtn)
    await sleep(250)

    const statusObj = findSceneObjectByName("StoreStatusText", storeCard)!
    const statusTextComp = statusObj.getComponent("Component.Text") as Text
    expect(statusTextComp.text.indexOf("Order confirmed") >= 0).toBe(true)
  }
}
