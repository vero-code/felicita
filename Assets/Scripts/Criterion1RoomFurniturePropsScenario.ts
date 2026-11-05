import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils"

@component
export class Criterion1RoomFurniturePropsScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(400)

    const roomFrame = findSceneObjectByName("RoomFrame")
    const roomTable = findSceneObjectByName("RoomTable")
    const roomChair = findSceneObjectByName("RoomChair")
    const roomShelf = findSceneObjectByName("RoomShelf")

    expect(roomFrame !== undefined && roomFrame.enabled, "RoomFrame should exist and be enabled").toBe(true)
    expect(roomTable !== undefined && roomTable.enabled, "RoomTable should exist and be enabled").toBe(true)
    expect(roomChair !== undefined && roomChair.enabled, "RoomChair should exist and be enabled").toBe(true)
    expect(roomShelf !== undefined && roomShelf.enabled, "RoomShelf should exist and be enabled").toBe(true)

    const tableRmv = roomTable!.getComponent("Component.RenderMeshVisual") as RenderMeshVisual
    const chairRmv = roomChair!.getComponent("Component.RenderMeshVisual") as RenderMeshVisual
    const shelfRmv = roomShelf!.getComponent("Component.RenderMeshVisual") as RenderMeshVisual

    expect(tableRmv !== null && tableRmv.mesh !== null, "RoomTable mesh should be built").toBe(true)
    expect(chairRmv !== null && chairRmv.mesh !== null, "RoomChair mesh should be built").toBe(true)
    expect(shelfRmv !== null && shelfRmv.mesh !== null, "RoomShelf mesh should be built").toBe(true)

    const bigBlue = findSceneObjectByName("Lamp_BigBlue")
    const whiteHandle = findSceneObjectByName("Lamp_WhiteHandle")
    const flashlight = findSceneObjectByName("Lamp_Flashlight")
    const candle = findSceneObjectByName("Lamp_Candle")

    expect(bigBlue !== undefined && bigBlue.enabled, "Lamp_BigBlue should exist").toBe(true)
    expect(whiteHandle !== undefined && whiteHandle.enabled, "Lamp_WhiteHandle should exist").toBe(true)
    expect(flashlight !== undefined && flashlight.enabled, "Lamp_Flashlight should exist").toBe(true)
    expect(candle !== undefined && candle.enabled, "Lamp_Candle should exist").toBe(true)

    const lumenTextObj = findSceneObjectByName("LumenStatusText")
    expect(lumenTextObj !== undefined, "LumenStatusText should exist").toBe(true)
    const lumenTextComp = lumenTextObj!.getComponent("Component.Text") as Text
    expect(lumenTextComp.text.indexOf("lumens") >= 0, "HUD should display lumens").toBe(true)
  }
}
