# Felicita — Spatial Light Planner for Snap SPECS 💡

[![Platform](https://img.shields.io/badge/Platform-Snap%20SPECS%2027-000000?style=for-the-badge&logo=snapchat&logoColor=yellow)](https://developers.specs.com/)
[![Lens Studio](https://img.shields.io/badge/Lens%20Studio-v5.23.2-FFFC00?style=for-the-badge&logo=snapchat&logoColor=black)](https://ar.snap.com/)
[![LEAF Tests](https://img.shields.io/badge/LEAF%20Tests-5%2F5%20Passed-brightgreen?style=for-the-badge)](Assets/Scripts/LeafIndex.ts)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](Assets/Scripts/)
[![CLAD](https://img.shields.io/badge/Built%20With-CLAD%20%2B%20MCP-blueviolet?style=for-the-badge)](devpost/design-brief.md)

An AR utility for **Snap SPECS** that helps plan emergency room lighting during a power outage. Built with **Lens Studio 5.23.2**, **Spectacles Interaction Kit (SIK)**, **Spectacles UI Kit**, and **LEAF**.

---

## 🎬 Demo Video
[![Felicita — Spatial Light Planner Demo Video](https://img.youtube.com/vi/E3mq2rN1UN4/maxresdefault.jpg)](https://youtu.be/E3mq2rN1UN4)

---

## Overview

During a blackout, walking around with a phone flashlight occupies one hand and only lights a narrow beam. **Felicita** lets you plan where to place portable battery lamps across a dark room so the space is evenly lit:

1. Pick up 3D battery lamps using **pinch-and-drag** hand gestures.
2. See recommended placement spots pulse on room surfaces.
3. Snap lamps onto spots to activate radial light zones and track total lumens (`lm`) against room lighting norms (`10 m²`, `15 m²`, `20 m²`).
4. Look into an unlit dark corner with empty hands to open an emergency lamp order card.

---

## Why AR Glasses?

- **Hands-Free:** Keeps both hands free to carry real lanterns and flashlights in the dark instead of holding a phone screen.
- **World-Anchored:** Lamps, target hotspots, and radial light zones sit directly on room furniture and floor surfaces at centimeter scale.
- **Context-Aware:**
  - When your hands are empty, placement spots stay dimmed so they don't clutter your view.
  - Target rings pulse only when you are actively holding a lamp.
  - Looking at the unlit corner with empty hands highlights `DarkCornerMarker`; picking up any lamp automatically hides the store card.
  - Uses high-contrast gold, cyan, and white elements designed for additive see-through displays (where black renders as transparent).

---

## Key Features

- **4 3D Emergency Light Sources** (`.glb` models with emissive glow cores):
  - **`Lamp_BigBlue`** — Big Blue Lamp (`+400 lm`, `22 cm` base zone radius)
  - **`Lamp_WhiteHandle`** — White Handle Lamp (`+400 lm`, `20 cm` base zone radius)
  - **`Lamp_Flashlight`** — Emergency Flashlight (`+250 lm`, `17 cm` base zone radius)
  - **`Lamp_Candle`** — LED Candle (`+150 lm`, `14 cm` base zone radius)
- **4 Surface Placement Hotspots:**
  - `Hotspot_TableCenter` (Table Center Spot)
  - `Hotspot_ShelfEdge` (Shelf Spot)
  - `Hotspot_ChairSide` (Chair Side Spot)
  - `Hotspot_FloorFront` (Floor Front Spot)
- **Room Area Selector & Lumen Calculator (`10 m²` / `15 m²` / `20 m²` + `Reset`):**
  - Calculates target blackout illumination (`40 lm/m²`: **400 lm** for `10 m²`, **600 lm** for `15 m²`, **800 lm** for `20 m²`).
  - Updates the HUD readout (`+<total> lumens / <area> m² covered (<placed>/4 spots)` and `% lit`) and scales light zone radii (`×0.65`, `×0.88`, `×1.25`).
  - Includes a **Reset** button on the HUD to return all lamps to their starting positions.
- **Dark Corner Emergency Store Card:**
  - Pinching `DarkCornerMarker` with empty hands opens a `30 × 20 cm` `SpectaclesUIKit` card (*"No lamp? Order delivery today — Express Battery Lantern (+400 lm) · 15 min courier"*).
  - Clicking **Order Lamp** adds `+400 lm` to the room's total illumination.
- **Spatial Audio:**
  - Custom WAV sound cues (`LampPickup.wav`, `LampPlace.wav`, `StoreOpen.wav`) triggered on pickup, snap, and store actions.

---

## Tech Stack & Tools

- **Platform & Engine:** [Lens Studio 5.23.2](https://ar.snap.com/download/v5-23-2) targeting **Snap SPECS 27** (`Perspective` Camera + `DeviceTracking` World mode)
- **Language:** TypeScript (ES2021 component architecture extending `BaseScriptComponent`)
- **Hand Tracking & Interaction:** **Spectacles Interaction Kit (SIK)** (`Interactable`, `InteractableManipulation`, `InteractorEvent`) for 6DoF pinch, grab, drag, and snap-to-surface physics
- **Spatial UI:** **Spectacles UI Kit** (`Frame`, `BackPlate`, `FlexLayout`, `RectangleButton`) for world-space HUD and interactive emergency store card
- **3D Modelling & Geometry:**
  - **SPECS Text-to-3D AI Generator** for textured `.glb` emergency lamp models (`LampBigBlue`, `LampWhiteHandle`, `LampFlashlight`, `LampCandle`)
  - **Runtime `MeshBuilder`** for dynamic concentric radial light coverage zones, pulsing target rings, and emissive glow cores
- **Spatial Audio:** Custom 44.1 kHz WAV sound effects synthesized offline via Node.js algorithmic audio synthesis (`AudioComponent` in `LowLatency` mode)
- **Automated QA & Testing:** **LEAF (`Leaf.lspkg` — Lens Evaluation & Automation Framework)** with `DefaultLeafInteractor` driving 5 end-to-end automated test scenarios
- **Agentic Workflow:** Planned with the **Devpost Learn (`plan-lens`)** skill pack (`devpost/design-brief.md`) and built via **CLAD (Closed Loop Agentic Development)** + **Lens Studio MCP**

---

## Project Structure

```text
felicita/
├── felicita.esproj                    # Lens Studio 5.23.2 project file
├── devpost/
│   └── design-brief.md                # AR design brief and done criteria
├── Assets/
│   ├── Scene.scene                    # Main SPECS 27 scene (Evening Room)
│   ├── GeneratedMeshes/               # 3D GLB lamp models
│   │   ├── LampBigBlue.glb
│   │   ├── LampWhiteHandle.glb
│   │   ├── LampFlashlight.glb
│   │   └── LampCandle.glb
│   ├── GeneratedSFX/                  # 44.1 kHz WAV sound effects
│   │   ├── LampPickup.wav
│   │   ├── LampPlace.wav
│   │   └── StoreOpen.wav
│   ├── Icons/                         # UI icons (lightbulb, refresh, shopping_cart, close)
│   └── Scripts/
│       ├── FelicitaMain.ts                # Main orchestrator: SIK interactions, snapping, gaze & HUD sync
│       ├── FelicitaState.ts               # Domain state: lumens, hotspots, room m² norms & radii
│       ├── FelicitaStatusHudUI.ts         # Floating HUD with 10/15/20 m² & Reset buttons (Spectacles UI Kit)
│       ├── FelicitaEmergencyStoreUI.ts    # Floating 30×20 cm emergency store card (+400 lm order)
│       ├── FelicitaLampMesh.ts            # 3D GLB loader + pulsing emissive glow core
│       ├── FelicitaHotspotZoneMesh.ts     # Surface dots, target rings & radial light zones
│       ├── FelicitaRoomFurnitureMesh.ts   # Room furniture surface anchors & brightness response
│       ├── FelicitaAudioController.ts     # Audio cue playback controller
│       ├── LeafIndex.ts                   # LEAF @scenariosIndex test registry
│       ├── Criterion1RoomFurniturePropsScenario.ts
│       ├── Criterion2PinchLampRevealsSpotsScenario.ts
│       ├── Criterion3PlaceLampSnapsAndUpdatesLumensScenario.ts
│       ├── Criterion4MultipleLampsAdditiveLumensScenario.ts
│       └── Criterion5DarkCornerStoreCardScenario.ts
└── Packages/                          # Installed packages (SIK, UIKit, Leaf, Motion, Icons)
```

---

## How to Run in Lens Studio Preview

1. Clone this repository and open `felicita.esproj` in **Lens Studio 5.23.2**.
2. In the **Preview Panel**:
   - Set device simulation to **SPECS 27** and select the **Evening Room** interactive environment.
   - Enable **Interactive Preview** (click the walk/hand icon at the top of the Preview panel).
3. **Controls:**
   - **Move:** `W`, `A`, `S`, `D` (`Q` / `E` for vertical movement).
   - **Look around:** Hold **Right Mouse Button** (or **Shift**) + move mouse.
   - **Pick up & place a lamp:** Left-click and hold any lamp, drag it within `65 cm` of a pulsing hotspot ring, and release to snap.
   - **Switch room area (`10 m²` / `15 m²` / `20 m²`) or Reset:** Click the buttons on the floating HUD.
   - **Open store card:** With empty hands, look toward `DarkCornerMarker` and click (pinch) it.

---

## Automated Testing (LEAF)

All 5 Done Criteria from [`devpost/design-brief.md`](devpost/design-brief.md) are verified by automated **LEAF** scenarios in [`Assets/Scripts/LeafIndex.ts`](Assets/Scripts/LeafIndex.ts):

| Scenario ID | Done Criterion Verified | Status |
| :--- | :--- | :---: |
| `Criterion 1 - Dark Room and Furniture Props` | Room props, 4 lamps, 4 surface spots, and HUD initialize at real-world scale. | ✅ **PASSED** |
| `Criterion 2 - Pinch Lamp Reveals Target Placement Spots` | Pinching a lamp reveals pulsing target placement rings on room surfaces. | ✅ **PASSED** |
| `Criterion 3 - Place Lamp Snaps Activates Light Zone and Updates Lumens` | Placing a lamp on a spot snaps it, activates its light zone, and updates lumens. | ✅ **PASSED** |
| `Criterion 4 - Multiple Lamps Increase Illumination Additively` | Placing multiple lamps increases total room illumination additively. | ✅ **PASSED** |
| `Criterion 5 - Empty Hands Gaze Unlit Corner Opens Emergency Store Card` | Gazing at the unlit corner with empty hands reveals the marker; pinching opens the store card. | ✅ **PASSED** |

---

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.