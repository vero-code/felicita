/**
 * FelicitaHotspotZoneMesh — Procedural 3D meshes for target placement hotspots,
 * radial light coverage zones, and the unlit dark-corner marker.
 *
 * Owns:
 * - Subtle 5 cm diameter grey dot (HotspotDot) when inactive
 * - Highlighted target ring (HotspotHighlight) when a lamp is held in hand
 * - Expanding radial light coverage zone (LightCoverageZone) when a lamp is placed on the spot
 * - Dark corner interactive beacon (when isDarkCorner = true)
 *
 * Expects @input:
 * - material: vertexBaseColorMaterial from SimpleVertexBaseColor.lspkg
 */

type RGBA = [number, number, number, number]

function buildDiscOrRing(
  builder: MeshBuilder,
  innerR: number,
  outerR: number,
  height: number,
  segments: number,
  color: RGBA,
  baseIdx: number = 0
): number {
  const profile: [number, number][] = innerR <= 0.01
    ? [[0.0, 0.0], [outerR, 0.0], [outerR, height], [0.0, height]]
    : [[innerR, 0.0], [outerR, 0.0], [outerR, height], [innerR, height], [innerR, 0.0]]

  const P = profile.length
  let vi = baseIdx
  const startIdx = vi
  const indices: number[] = []

  for (let i = 0; i <= segments; i++) {
    const th = (i / segments) * Math.PI * 2
    const c = Math.cos(th), s = Math.sin(th)
    for (let j = 0; j < P; j++) {
      const [r, y] = profile[j]
      builder.appendVerticesInterleaved([
        r * c, y, r * s,
        0, 1, 0,
        ...color,
      ])
      vi++
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < P - 1; j++) {
      const bl = startIdx + i * P + j
      const br = startIdx + i * P + (j + 1)
      const tl = startIdx + (i + 1) * P + j
      const tr = startIdx + (i + 1) * P + (j + 1)
      indices.push(bl, br, tr, bl, tr, tl)
    }
  }

  builder.appendIndices(indices)
  return vi
}

@component
export class FelicitaHotspotZoneMesh extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">FelicitaHotspotZoneMesh – Hotspot dot, highlight & light zone</span>')
  @ui.separator

  @ui.group_start("References")
  @input
  @hint("Vertex color material from SimpleVertexBaseColor.lspkg")
  material!: Material
  @ui.group_end

  @ui.separator
  @ui.group_start("Settings")
  @input
  @hint("True if this marker is the distant unlit corner marker rather than a surface lamp hotspot")
  isDarkCorner: boolean = false

  @input
  @widget(new SliderWidget(6.0, 18.0, 0.5))
  @hint("Expanded light coverage zone radius in cm (stand-in scaled from 1.5m - 3.0m)")
  lightZoneRadiusCm: number = 12.0
  @ui.group_end

  public dotSO!: SceneObject
  public highlightSO!: SceneObject
  public lightZoneSO!: SceneObject

  private zoneTargetScale: number = 0.01
  private zoneCurrentScale: number = 0.01
  private animPhase: number = 0

  onAwake(): void {
    const suffix = this.sceneObject.name

    // 1. Subtle 5 cm diameter (2.5 cm radius) grey dot
    this.dotSO = global.scene.createSceneObject(`${suffix}_Dot`)
    this.dotSO.setParent(this.sceneObject)
    this.buildSubtleDot()

    // 2. Highlighted target ring (shown when holding a lamp, or when gazing at dark corner with empty hands)
    this.highlightSO = global.scene.createSceneObject(`${suffix}_Highlight`)
    this.highlightSO.setParent(this.sceneObject)
    this.buildHighlightRing()
    this.highlightSO.enabled = false

    // 3. Expanding radial light coverage zone (shown when a lamp is placed on this spot)
    this.lightZoneSO = global.scene.createSceneObject(`${suffix}_LightZone`)
    this.lightZoneSO.setParent(this.sceneObject)
    this.buildLightCoverageZone(this.lightZoneRadiusCm)
    this.lightZoneSO.getTransform().setLocalScale(new vec3(0.05, 1, 0.05))
    this.lightZoneSO.enabled = false

    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  /** Updates visibility for a placement hotspot:
   * - Inactive & no lamp held: subtle grey dot ON, highlight OFF, lightZone OFF
   * - Lamp held in hand (unoccupied): subtle grey dot ON, highlight ON (pulsing), lightZone OFF
   * - Occupied (lamp placed): subtle grey dot OFF (faded out), highlight OFF, lightZone ON (expands outward)
   */
  public setHotspotState(lampHeld: boolean, occupied: boolean, radiusCm?: number): void {
    if (radiusCm && Math.abs(radiusCm - this.lightZoneRadiusCm) > 0.2) {
      this.lightZoneRadiusCm = radiusCm
      this.buildLightCoverageZone(radiusCm)
    }
    if (occupied) {
      this.dotSO.enabled = false
      this.highlightSO.enabled = false
      this.lightZoneSO.enabled = true
      this.zoneTargetScale = 1.0
    } else {
      this.dotSO.enabled = true
      this.highlightSO.enabled = lampHeld
      this.lightZoneSO.enabled = false
      this.zoneTargetScale = 0.05
      this.zoneCurrentScale = 0.05
    }
  }

  /** Updates visibility for the unlit dark corner marker:
   * - Appears and highlights when hands are empty and user gazes/aims at the unlit corner
   */
  public setDarkCornerState(handsEmpty: boolean, gazedOrHovered: boolean): void {
    this.dotSO.enabled = handsEmpty
    this.highlightSO.enabled = handsEmpty && gazedOrHovered
  }

  private onUpdate(): void {
    const dt = getDeltaTime()
    this.animPhase += dt * 4.5

    if (this.highlightSO && this.highlightSO.enabled) {
      const pulse = 1.0 + 0.10 * Math.sin(this.animPhase)
      this.highlightSO.getTransform().setLocalScale(new vec3(pulse, 1.0, pulse))
    }

    if (this.lightZoneSO && this.lightZoneSO.enabled) {
      this.zoneCurrentScale += (this.zoneTargetScale - this.zoneCurrentScale) * Math.min(1, dt * 6.0)
      const s = Math.max(0.05, this.zoneCurrentScale)
      this.lightZoneSO.getTransform().setLocalScale(new vec3(s, 1.0, s))
    }
  }

  private buildSubtleDot(): void {
    const rmv = this.dotSO.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    const builder = new MeshBuilder([
      { name: "position", components: 3 },
      { name: "normal", components: 3, normalized: true },
      { name: "color", components: 4 },
    ])
    builder.topology = MeshTopology.Triangles
    builder.indexType = MeshIndexType.UInt16

    // 5 cm diameter = 2.5 cm radius subtle low-contrast grey dot
    const col: RGBA = this.isDarkCorner ? [0.55, 0.52, 0.62, 1.0] : [0.50, 0.54, 0.60, 1.0]
    buildDiscOrRing(builder, 0.0, 2.5, 0.22, 20, col, 0)

    rmv.mesh = builder.getMesh()
    if (this.material) rmv.mainMaterial = this.material
    builder.updateMesh()
  }

  private buildHighlightRing(): void {
    const rmv = this.highlightSO.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    const builder = new MeshBuilder([
      { name: "position", components: 3 },
      { name: "normal", components: 3, normalized: true },
      { name: "color", components: 4 },
    ])
    builder.topology = MeshTopology.Triangles
    builder.indexType = MeshIndexType.UInt16

    const outerCol: RGBA = this.isDarkCorner ? [1.0, 0.78, 0.32, 1.0] : [0.38, 0.94, 1.0, 1.0]
    const innerCol: RGBA = this.isDarkCorner ? [1.0, 0.92, 0.55, 1.0] : [0.82, 0.98, 1.0, 1.0]
    let vi = 0
    vi = buildDiscOrRing(builder, 2.7, 4.2, 0.32, 24, outerCol, vi)
    vi = buildDiscOrRing(builder, 0.0, 1.6, 0.38, 20, innerCol, vi)

    rmv.mesh = builder.getMesh()
    if (this.material) rmv.mainMaterial = this.material
    builder.updateMesh()
  }

  private buildLightCoverageZone(radius: number): void {
    let rmv = this.lightZoneSO.getComponent("Component.RenderMeshVisual") as RenderMeshVisual | null
    if (!rmv) rmv = this.lightZoneSO.createComponent("Component.RenderMeshVisual") as RenderMeshVisual

    const builder = new MeshBuilder([
      { name: "position", components: 3 },
      { name: "normal", components: 3, normalized: true },
      { name: "color", components: 4 },
    ])
    builder.topology = MeshTopology.Triangles
    builder.indexType = MeshIndexType.UInt16

    // Soft radial concentric illumination circles
    let vi = 0
    vi = buildDiscOrRing(builder, 0.0, radius * 0.42, 0.18, 28, [1.0, 0.95, 0.68, 1.0], vi)
    vi = buildDiscOrRing(builder, radius * 0.44, radius * 0.75, 0.14, 28, [0.85, 0.82, 0.52, 1.0], vi)
    vi = buildDiscOrRing(builder, radius * 0.77, radius, 0.10, 28, [0.58, 0.64, 0.48, 1.0], vi)

    rmv.mesh = builder.getMesh()
    if (this.material) rmv.mainMaterial = this.material
    builder.updateMesh()
  }
}

