---
status: draft
---

# Design brief: Felicita - Spatial Light Planner

<!-- Filled in by plan-lens from the learner's interview. Use the learner's words. Mark any value they didn't choose as (default). -->

## The one spatial moment
During a blackout, the user puts on AR glasses in a dark room, picks up battery lamps with a natural pinch-and-drag gesture, and places them onto optimal spatial hotspots to illuminate the 20 m² room efficiently, with unlit corners offering a quick way to order more light.

## Why it belongs on glasses
- Uses: draws in the world, leaves your body free, shares your view
- Why it's better than the phone or laptop version: A phone forces you to hold a screen with one hand while trying to carry lamps in the dark, and a flashlight only illuminates a narrow beam where you point it. AR glasses leave both hands free to handle lamps and project light distribution zones directly onto the physical room surfaces.

## Product or overlay
- Type: overlay responding to room space and light distribution
- What the real version would sense: physical room geometry, ambient darkness, real lamp positions, battery levels, and lumen ratings
- Stand-in for the preview: A simulated 3D room with household furniture (table, chair, shelf), a set of virtual emergency light sources (big blue lamp, white lamp with handle, flashlight, candle), and target hotspot indicators showing optimal placements.

## Where things live
- Where the user is looking during the main task: Looking forward and slightly downward around the room at surfaces (table, floor, shelves) at arm's length (0.8 m to 1.8 m).
- Available lamps: Initially resting on room surfaces (table at 0.8 m, shelf at 1.2 m).
- Placement target hotspots: Small subtle dots (default: 5 cm diameter) resting on flat surfaces in dark areas.
- Light coverage zones: Soft radial illumination circles (default: 1.5 m - 3.0 m radius depending on lamp lumens) appearing on surfaces around placed lamps.
- Room light status: Subtle floating readout (e.g. "+800 lumens / 20 m² covered") hovering near the table area at eye level (default: 1.2 m high, 1.0 m away).
- Emergency store card: Compact floating card (default: 30 cm x 20 cm) appearing in distant dark corners when targeted with empty hands.

## Hands and input
- Pinch & Drag: Pinch a lamp to pick it up and drag it across the room to a recommended spot.
- Release to place: Releasing the pinch snaps the lamp to the surface hotspot and activates its light zone.
- Pinch to interact: Pinching the dark corner marker opens the emergency lamp store card ("No lamp? Order delivery today").
- Targets are big and highlight when aimed at.
- Voice fallback: Simulated room area selection buttons (e.g. "20 m²") alongside voice concept, ensuring preview reliability.

## When things show
- Inactive lamps and spots: Shown as subtle, low-contrast grey dots so they do not clutter the narrow view.
- Placement spots: Highlight when a lamp is held in hand; fade out once the lamp is placed.
- Light zones: Expand outward when a lamp is placed in position.
- Emergency store card: Appears only when hands are empty and the user gazes into an unlit corner; disappears when closed or when a lamp is picked up.

## Done criteria
Each one can be checked in Lens Studio's preview.
1. The user can walk around a simulated dark room with furniture props (table, chair, shelf) using keyboard (WASD) and mouse.
2. The user can pinch and pick up a battery lamp and see recommended target placement spots appear on room surfaces.
3. Placing a lamp on a target spot snaps it in place, activates its light coverage zone, and updates the room lumen counter.
4. Placing multiple lamps increases overall room illumination additively.
5. With empty hands, gazing at an unlit corner reveals an interactive marker; pinching it opens a compact emergency lamp ordering card.

## Out of scope
- Live camera recognition of physical room walls or real lamp barcodes.
- Real e-commerce payment processing (represented by a simulated order card).
- Multi-user shared session.

## Risks and open questions
- Additive display: On transparent glasses, black is transparent, so "darkness" is experienced by the absence of virtual light in a dark room; in the preview, it is simulated via a dim room environment.
- Voice transcription in preview may be unreliable, so interactive fallback buttons carry the demo.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources

