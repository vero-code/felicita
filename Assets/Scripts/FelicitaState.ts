/**
 * FelicitaState — Pure domain state and additive lumen calculation for Felicita.
 *
 * Owns:
 * - Lamp definitions (id, displayName, lumens, zoneRadiusCm, placedHotspotId)
 * - Hotspot occupancy map
 * - Held lamp tracking (empty hands vs holding a lamp)
 * - Selected room area in m² (15, 20, 30) and additive lumen sum
 *
 * Must not:
 * - Access SceneObjects, UI components, or audio directly
 */

export interface LampSpec {
  id: string
  sceneName: string
  displayName: string
  lumens: number
  zoneRadiusCm: number
  placedHotspotId: string | null
}

export interface HotspotSpec {
  id: string
  sceneName: string
  displayName: string
  occupiedByLampId: string | null
}

export class FelicitaState {
  public roomAreaSqM: number = 20
  public heldLampId: string | null = null
  public storeCardOpen: boolean = false
  public orderedExtraLumens: number = 0

  public readonly lamps: Record<string, LampSpec> = {
    big_blue: {
      id: "big_blue",
      sceneName: "Lamp_BigBlue",
      displayName: "Big Blue Lamp",
      lumens: 400,
      zoneRadiusCm: 22.0,
      placedHotspotId: null,
    },
    white_handle: {
      id: "white_handle",
      sceneName: "Lamp_WhiteHandle",
      displayName: "White Handle Lamp",
      lumens: 400,
      zoneRadiusCm: 20.0,
      placedHotspotId: null,
    },
    flashlight: {
      id: "flashlight",
      sceneName: "Lamp_Flashlight",
      displayName: "Emergency Flashlight",
      lumens: 250,
      zoneRadiusCm: 17.0,
      placedHotspotId: null,
    },
    candle: {
      id: "candle",
      sceneName: "Lamp_Candle",
      displayName: "LED Candle",
      lumens: 150,
      zoneRadiusCm: 14.0,
      placedHotspotId: null,
    },
  }

  public readonly hotspots: Record<string, HotspotSpec> = {
    table_center: {
      id: "table_center",
      sceneName: "Hotspot_TableCenter",
      displayName: "Table Center Spot",
      occupiedByLampId: null,
    },
    shelf_edge: {
      id: "shelf_edge",
      sceneName: "Hotspot_ShelfEdge",
      displayName: "Shelf Spot",
      occupiedByLampId: null,
    },
    chair_side: {
      id: "chair_side",
      sceneName: "Hotspot_ChairSide",
      displayName: "Chair Side Spot",
      occupiedByLampId: null,
    },
    floor_front: {
      id: "floor_front",
      sceneName: "Hotspot_FloorFront",
      displayName: "Floor Front Spot",
      occupiedByLampId: null,
    },
  }

  public configureLumens(bigBlueLm: number, whiteHandleLm: number): void {
    this.lamps.big_blue.lumens = bigBlueLm
    this.lamps.white_handle.lumens = whiteHandleLm
  }

  public isHandsEmpty(): boolean {
    return this.heldLampId === null
  }

  public pickUpLamp(lampId: string): LampSpec | null {
    const lamp = this.lamps[lampId]
    if (!lamp) return null

    // If lamp was already on a hotspot, free that hotspot
    if (lamp.placedHotspotId) {
      const prevSpot = this.hotspots[lamp.placedHotspotId]
      if (prevSpot && prevSpot.occupiedByLampId === lampId) {
        prevSpot.occupiedByLampId = null
      }
      lamp.placedHotspotId = null
    }

    this.heldLampId = lampId
    this.storeCardOpen = false
    return lamp
  }

  public placeLampOnHotspot(lampId: string, hotspotId: string): boolean {
    const lamp = this.lamps[lampId]
    const spot = this.hotspots[hotspotId]
    if (!lamp || !spot) return false
    if (spot.occupiedByLampId !== null && spot.occupiedByLampId !== lampId) {
      return false
    }

    if (lamp.placedHotspotId && this.hotspots[lamp.placedHotspotId]) {
      this.hotspots[lamp.placedHotspotId].occupiedByLampId = null
    }

    lamp.placedHotspotId = hotspotId
    spot.occupiedByLampId = lampId
    if (this.heldLampId === lampId) {
      this.heldLampId = null
    }
    return true
  }

  public dropHeldLamp(): void {
    this.heldLampId = null
  }

  public totalLumens(): number {
    let sum = this.orderedExtraLumens
    for (const key of Object.keys(this.lamps)) {
      const lamp = this.lamps[key]
      if (lamp.placedHotspotId !== null) {
        sum += lamp.lumens
      }
    }
    return sum
  }

  public placedLampCount(): number {
    let count = 0
    for (const key of Object.keys(this.lamps)) {
      if (this.lamps[key].placedHotspotId !== null) {
        count++
      }
    }
    return count
  }

  public totalHotspotCount(): number {
    return Object.keys(this.hotspots).length
  }

  /** Emergency lighting standard target lumens: 10 m² -> 400 lm, 15 m² -> 600 lm, 20 m² -> 800 lm */
  public recommendedLumens(): number {
    return this.roomAreaSqM * 40
  }

  /** Percentage of target illumination achieved for the selected room area */
  public coveragePercent(): number {
    const target = this.recommendedLumens()
    if (target <= 0) return 0
    return Math.min(100, Math.round((this.totalLumens() / target) * 100))
  }

  /** Light distribution radius scaling factor based on room dimensions */
  public zoneRadiusScale(): number {
    if (this.roomAreaSqM <= 10) return 0.65 // Compact local light pool for small 10 m² room
    if (this.roomAreaSqM <= 15) return 0.88 // Standard 15 m² distribution
    return 1.25 // Wide spread across large 20 m² room
  }

  public reset(): void {
    this.heldLampId = null
    this.storeCardOpen = false
    this.orderedExtraLumens = 0
    for (const k of Object.keys(this.lamps)) {
      this.lamps[k].placedHotspotId = null
    }
    for (const k of Object.keys(this.hotspots)) {
      this.hotspots[k].occupiedByLampId = null
    }
  }
}

