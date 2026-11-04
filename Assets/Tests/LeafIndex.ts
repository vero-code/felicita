/**
 * LeafIndex.ts
 * Registration index for all LEAF scenarios in the Felicita project.
 */

import { scenariosIndex } from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator";
import { Criterion1_WalkaroundTest } from "./Criterion1_WalkaroundTest";
import { Criterion2_PinchLampTest } from "./Criterion2_PinchLampTest";
import { Criterion3_PlaceLampTest } from "./Criterion3_PlaceLampTest";
import { Criterion4_AdditiveLightTest } from "./Criterion4_AdditiveLightTest";
import { Criterion5_CornerStoreTest } from "./Criterion5_CornerStoreTest";

@scenariosIndex([
    Criterion1_WalkaroundTest,
    Criterion2_PinchLampTest,
    Criterion3_PlaceLampTest,
    Criterion4_AdditiveLightTest,
    Criterion5_CornerStoreTest
])
@component
export class LeafIndex extends BaseScriptComponent {
    onAwake(): void {
        print("[LeafIndex] LEAF Scenarios registered: 5 scenarios loaded.");
    }
}

