# Felicita — Spatial Light Planner for Snap SPECS 💡🕶️

Built for the **Learn AR with SPECS** Hackathon using **Lens Studio 5.23.2**, **CLAD (Closed Loop Agentic Development)**, **Lens Studio MCP**, **Spectacles Interaction Kit (SIK)**, **Spectacles UI Kit**, and **LEAF (Lens Evaluation & Automation Framework)**.

---

## 🌟 Overview

**Felicita — Spatial Light Planner** is a spatial augmented reality utility designed for **Snap SPECS** that helps users plan and optimize emergency room illumination during a power outage (blackout).

When a blackout hits, navigating a dark room while holding a smartphone flashlight ocupaies one hand, narrows your field of view to a single beam, and makes it hard to figure out where to place portable battery lamps so the entire living space is evenly lit. **Felicita** solves this through spatial computing: you put on your AR glasses, pick up portable emergency light sources with natural **pinch-and-drag** hand gestures, and place them onto recommended spatial hotspots distributed across real furniture and room corners. As each lamp snaps into place, radial illumination zones expand across the surfaces, and a world-space HUD calculates real-time lumen coverage (`lm`), target illumination norms (`% lit`) for your room size (`10 m²`, `15 m²`, or `20 m²`), and remaining dark spots. If a distant corner remains unlit and you have no lamps left in hand, gazing into the dark corner reveals an interactive spatial prompt to order an emergency battery lantern for same-day delivery.

---

## 👓 Why It Belongs on AR Glasses (Design Rationale)

Instead of floating a 2D app window in front of the user's face, **Felicita** is built around the three core principles of glasses-first AR design:

1. **Leaves Your Body Free:** During a power outage, you need both hands free to carry lanterns, flashlights, and candles safely through a dark home. A phone screen ties up one hand; AR glasses keep your hands free and your eyes up.
2. **Draws in the World:** Illumination zones, surface placement hotspots, and lamp props live directly on physical room geometry—the round coffee table, wooden credenza, floor rug, and high corner wall shelf—at true-to-life centimeter scale.
3. **Shares Your View:** The experience responds to where you look and what your hands are doing:
   - **Contextual Decluttering:** When your hands are empty, target hotspots rest as subtle, low-contrast 5 cm surface dots so they never clutter your field of view.
   - **Active Guidance:** The moment you pinch and lift a lamp, target placement rings pulse across the room to guide placement.
   - **Gaze + Empty-Hands Trigger:** Looking toward the unlit far-left corner while your hands are empty highlights the `DarkCornerMarker`, allowing a quick pinch to summon the compact emergency store card (`"No lamp? Order delivery today"`). Picking up any lamp automatically dismisses the store card.
   - **Additive Display Awareness:** Because optical see-through waveguide displays are additive (black renders as transparent), all UI elements, radial light rings, and typography are designed with high-contrast warm gold, cyan, and soft white palettes against the dim `Evening Room` environment.

---

## ✨ Key Features

- **4 AI-Generated 3D Emergency Light Sources** (created via **SPECS Text-to-3D** and normalized to real-world scale):
  - **Big Blue Rechargeable Lantern** (`+400 lumens`)
  - **White Portable Handle Lamp** (`+400 lumens`)
  - **Tactical Aluminum Flashlight** (`+250 lumens`)
  - **Warm Amber LED Candle** (`+150 lumens`)
- **4 Spatial Placement Hotspots Across the Room:**
  - **Coffee Table Center** (`[-2, -93, -198]`) — central living area illumination.
  - **Credenza Shelf Center** (`[6, -71.8, -250]`) — mid-height ambient bounce under the wall art.
  - **Left Floor Rug by the Turntable** (`[-48, -98, -225]`) — left-side floor zone coverage.
  - **Upper-Right Wooden Corner Shelf** (`[55, -18, -246]`) — elevated corner illumination.
- **Dynamic Room Area & Illumination Norm Calculator (`10 m²` / `15 m²` / `20 m²`):**
  - Calculates required residential ambient blackout illumination (`40 lm / m²`: **400 lm** for `10 m²`, **600 lm** for `15 m²`, **800 lm** for `20 m²`).
  - Displays live percentage of illumination norm achieved (e.g., `+650 / 600 lm (108% lit) • 15 m² (2/4 spots)`).
  - Dynamically scales the visual radius of light coverage zones on room surfaces (`×0.65`, `×0.88`, `×1.25`) to reflect how far a lamp's light stretches relative to room square footage.
- **Gaze-Aware Dark Corner & Emergency Store Card:**
  - Gazing at the unlit corner with empty hands activates the interactive corner marker.
  - Pinching the marker opens a world-space `SpectaclesUIKit` card to order an emergency 600 lm lantern (`Order 600 lm Lantern ($24)`).
- **Custom Procedural Spatial Audio SFX:**
  - Offline-synthesized, license-clean 44.1 kHz WAV sound effects (`LampPickup.wav`, `LampPlace.wav`, `StoreOpen.wav`) triggered on interaction.

---

## 🛠️ How It Was Built (CLAD & Technical Implementation)

This project was planned and built from scratch during the hackathon submission period using **Closed Loop Agentic Development (CLAD)**:

1. **AR Design Planning (`devpost/`):**
   - Planned using the [Devpost Learn skill pack](https://github.com/challengepost/learn-specs) (`plan-lens`), which interviewed the spatial concept, validated it against glasses UX guidelines, and generated [`devpost/design-brief.md`](devpost/design-brief.md).
2. **Scene Construction & Packages via Lens Studio MCP:**
   - Configured for **SPECS 27** (`Perspective` camera + `DeviceTracking` in `World` mode) inside the `Evening Room` interactive environment.
   - Built with **Spectacles Interaction Kit (SIK)** (`Interactable`, `InteractableManipulation`, `InteractorEvent`) and **Spectacles UI Kit** (`BackPlate`, `FlexLayout`, `Button`).
3. **3D Asset Generation (`/build-mesh`):**
   - Generated custom textured `.glb` meshes via Snap's **SPECS Text-to-3D** pipeline and normalized bounding boxes and ground pivots (`min-Y = 0`) using Node.js.
4. **Algorithmic Sound Synthesis (`/build-sfx`):**
   - Synthesized custom tactile audio cues for pickup, snap-to-hotspot placement, and store activation.
5. **Automated Integration Testing with LEAF (`5/5 Passing`):**
   - Authored and executed 5 automated **LEAF (`Leaf.lspkg`)** scenarios in the live Lens Studio Preview to verify every done criterion end-to-end.

---

## 📂 Project Structure

```text
felicita/
├── Project.esproj                     # Lens Studio 5.23+ SPECS project manifest
├── devpost/
│   └── design-brief.md                # AR design brief generated with the Devpost Learn skill pack
├── Assets/
│   ├── Scene.scene                    # Main SPECS 27 scene configured for Evening Room
│   ├── GeneratedMeshes/               # Custom 3D GLB lamp models generated via SPECS Text-to-3D
│   │   ├── LampBigBlue.glb
│   │   ├── LampWhiteHandle.glb
│   │   ├── LampFlashlight.glb
│   │   └── LampCandle.glb
│   ├── GeneratedSFX/                  # Procedurally synthesized 44.1 kHz WAV sound effects
│   │   ├── LampPickup.wav
│   │   ├── LampPlace.wav
│   │   └── StoreOpen.wav
│   └── Scripts/
│       ├── FelicitaMain.ts                # Core controller: SIK interactions, snapping, gaze & HUD sync
│       ├── FelicitaState.ts               # Pure state model: lumens, hotspots, room m² norms & radii
│       ├── FelicitaStatusHudUI.ts         # World-space HUD built with Spectacles UI Kit
│       ├── FelicitaEmergencyStoreUI.ts    # Compact world-space emergency lamp store card
│       ├── FelicitaLampMesh.ts            # 3D GLB prefab loader + pulsing emissive glow core
│       ├── FelicitaHotspotZoneMesh.ts     # Surface dots, pulsing target rings & radial light zones
│       ├── FelicitaRoomFurnitureMesh.ts   # Floating corner wooden shelf & room surface anchors
│       ├── FelicitaAudioController.ts     # Low-latency audio cue playback controller
│       ├── LeafIndex.ts                   # LEAF @scenariosIndex test registry
│       ├── Criterion1RoomPropsWalkaroundScenario.ts
│       ├── Criterion2PinchLampRevealsHotspotsScenario.ts
│       ├── Criterion3PlaceLampSnapsAndUpdatesLumensScenario.ts
│       ├── Criterion4MultipleLampsAdditiveLumensScenario.ts
│       └── Criterion5EmptyHandsDarkCornerStoreScenario.ts
└── Packages/                          # Installed Lens Studio packages (SIK, UIKit, Leaf)
```

---

## 🚀 How to Run & Test in Lens Studio Preview (No SPECS Required)

### Prerequisites
- **[Lens Studio 5.23.2](https://ar.snap.com/download/v5-23-2)** (recommended for SPECS / CLAD compatibility).

### Step-by-Step Instructions
1. Clone this repository and open `Project.esproj` in **Lens Studio 5.23.2**.
2. In the **Preview Panel**:
   - Set the simulation environment to **SPECS 27** and select the **Evening Room** 3D environment.
   - Enable **Interactive Preview** (click the interactive walk/hand icon at the top of the Preview panel).
3. **Controls in Interactive Preview:**
   - **Move around the room:** `W`, `A`, `S`, `D` (and `Q` / `E` to move vertically).
   - **Look around:** Hold **Right Mouse Button** (or **Shift**) and move the mouse.
   - **Pinch & Drag a Lamp:** Left-click and hold on any of the 4 lamps, drag it toward one of the pulsing golden target rings (on the coffee table, credenza, left rug, or upper-right corner shelf), and release the mouse button to snap it into place.
   - **Change Room Square Footage (`10 m²` / `15 m²` / `20 m²`):** Click the room area buttons on the floating HUD to observe the illumination norm (`% lit`) and radial light zones scale dynamically.
   - **Trigger Emergency Store Card:** With empty hands, look to the upper-left dark corner (`DarkCornerMarker`) and left-click (pinch) it to open the delivery card.

---

## 🧪 Automated Testing with LEAF

All 5 Done Criteria from [`devpost/design-brief.md`](devpost/design-brief.md) are verified by automated **LEAF** integration tests registered in [`Assets/Scripts/LeafIndex.ts`](Assets/Scripts/LeafIndex.ts):

| Scenario ID | Done Criterion Verified | Status |
| :--- | :--- | :---: |
| `criterion_1_room_props_walkaround` | 1. Room props, 4 lamps, 4 surface hotspots, and HUD initialize at real-world scale in the dark room. | ✅ **PASSED** |
| `criterion_2_pinch_lamp_reveals_hotspots` | 2. Pinching and holding a battery lamp reveals pulsing target placement rings across room surfaces. | ✅ **PASSED** |
| `criterion_3_place_lamp_snaps_and_updates_lumens` | 3. Releasing a lamp onto a hotspot snaps it in place, activates its radial light zone, and updates the lumen counter. | ✅ **PASSED** |
| `criterion_4_multiple_lamps_additive_lumens` | 4. Placing multiple lamps across different surfaces increases total room illumination additively (`400 + 400 + 250 = 1050 lm`). | ✅ **PASSED** |
| `criterion_5_empty_hands_dark_corner_store` | 5. Gazing at an unlit corner with empty hands reveals the corner marker; pinching it opens the emergency lamp store card. | ✅ **PASSED** |

To re-run the tests yourself in Lens Studio:
1. Open **Window → LEAF** (or the LeafPlugin panel).
2. Reset the Preview panel and run any or all of the 5 registered scenarios.

---

## 💡 What I Learned

- **Designing for Optical See-Through (Additive) Displays:** On real AR glasses, black pixels are completely transparent. Instead of drawing dark overlays to simulate a blackout, I learned to anchor the experience in Lens Studio's dim `Evening Room` and use warm, high-contrast additive geometry (pulsing gold target rings and layered radial illumination discs) that naturally blend with physical furniture surfaces.
- **Integrating with the Physical Room Instead of Blocking It:** Early iterations used procedural furniture blocks that occluded the room. Removing artificial walls and anchoring hotspots directly onto the existing furniture of `Evening Room` (the coffee table, credenza, rug, and a custom floating corner shelf) made the spatial experience feel genuinely grounded in the user's home.
- **Closed-Loop Verification with LEAF:** Writing automated LEAF scenarios for every done criterion allowed us to iterate on 3D `.glb` lamp models, spatial hotspot coordinates, and dynamic room-area scaling (`10 m²` / `15 m²` / `20 m²`) while guaranteeing zero regressions in core hand-interaction mechanics.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.