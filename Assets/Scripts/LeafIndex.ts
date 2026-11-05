import { scenariosIndex } from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator"
import { ScenarioMetadata } from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata"
import { Criterion1RoomFurniturePropsScenario } from "./Criterion1RoomFurniturePropsScenario"
import { Criterion2PinchLampRevealsSpotsScenario } from "./Criterion2PinchLampRevealsSpotsScenario"
import { Criterion3PlaceLampSnapsAndUpdatesLumensScenario } from "./Criterion3PlaceLampSnapsAndUpdatesLumensScenario"
import { Criterion4MultipleLampsAdditiveLumensScenario } from "./Criterion4MultipleLampsAdditiveLumensScenario"
import { Criterion5DarkCornerStoreCardScenario } from "./Criterion5DarkCornerStoreCardScenario"

@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenarios: ScenarioMetadata[] = [
    {
      id: "Criterion 1 - Dark Room and Furniture Props",
      typename: Criterion1RoomFurniturePropsScenario.getTypeName(),
    },
    {
      id: "Criterion 2 - Pinch Lamp Reveals Target Placement Spots",
      typename: Criterion2PinchLampRevealsSpotsScenario.getTypeName(),
    },
    {
      id: "Criterion 3 - Place Lamp Snaps Activates Light Zone and Updates Lumens",
      typename: Criterion3PlaceLampSnapsAndUpdatesLumensScenario.getTypeName(),
    },
    {
      id: "Criterion 4 - Multiple Lamps Increase Illumination Additively",
      typename: Criterion4MultipleLampsAdditiveLumensScenario.getTypeName(),
    },
    {
      id: "Criterion 5 - Empty Hands Gaze Unlit Corner Opens Emergency Store Card",
      typename: Criterion5DarkCornerStoreCardScenario.getTypeName(),
    },
  ]
}
