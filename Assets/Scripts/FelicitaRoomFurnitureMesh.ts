/**
 * FelicitaRoomFurnitureMesh — Procedural 3D room stand-in and furniture meshes (Table, Chair, Shelf, RoomFrame).
 *
 * Owns:
 * - Runtime MeshBuilder construction for the simulated dark room props ("table", "chair", "shelf", "room_frame").
 *
 * Expects @input:
 * - material: vertexBaseColorMaterial from SimpleVertexBaseColor.lspkg
 * - furnitureKind: "table" | "chair" | "shelf" | "room_frame"
 *
 * Must not:
 * - Create UI or Component.Text
 * - Mutate game state
 */

type RGBA = [number, number, number, number]

function addBox(
  builder: MeshBuilder,
  indices: number[],
  cx: number, cy: number, cz: number,
  hw: number, hh: number, hd: number,
  color: RGBA,
  baseIdx: number
): number {
  const x0 = cx - hw, x1 = cx + hw
  const y0 = cy - hh, y1 = cy + hh
  const z0 = cz - hd, z1 = cz + hd

  const verts: number[] = []
  let vi = baseIdx

  const face = (
    p0: [number, number, number],
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number],
    n: [number, number, number]
  ) => {
    verts.push(
      ...p0, ...n, ...color,
      ...p1, ...n, ...color,
      ...p2, ...n, ...color,
      ...p3, ...n, ...color
    )
    indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3)
    vi += 4
  }

  face([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0])   // +X
  face([x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0], [-1, 0, 0])  // -X
  face([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0])   // +Y
  face([x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [0, -1, 0])  // -Y
  face([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1])   // +Z
  face([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1])  // -Z

  builder.appendVerticesInterleaved(verts)
  return vi
}

@component
export class FelicitaRoomFurnitureMesh extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">FelicitaRoomFurnitureMesh – Room prop geometry</span>')
  @ui.separator

  @ui.group_start("References")
  @input
  @hint("Vertex color material from SimpleVertexBaseColor.lspkg")
  material!: Material
  @ui.group_end

  @ui.separator
  @ui.group_start("Settings")
  @input
  @widget(new ComboBoxWidget([
    new ComboBoxItem("Table", "table"),
    new ComboBoxItem("Chair", "chair"),
    new ComboBoxItem("Shelf", "shelf"),
    new ComboBoxItem("Room Frame", "room_frame"),
  ]))
  @hint("Which household furniture piece or room stand-in to build")
  furnitureKind: string = "table"

  @input("vec4", "{0.34, 0.25, 0.18, 1.0}")
  @widget(new ColorWidget())
  @hint("Primary surface tint for this furniture prop")
  primaryColor: vec4 = new vec4(0.34, 0.25, 0.18, 1.0)
  @ui.group_end

  private rmv: RenderMeshVisual | null = null
  private currentBoost: number = 0

  onAwake(): void {
    this.rebuildMesh(0)
  }

  /** Allows the room illumination controller to brighten room surfaces as lamps are placed. */
  public setIlluminationBoost(boost01: number): void {
    const clamped = Math.max(0, Math.min(1, boost01))
    if (Math.abs(clamped - this.currentBoost) < 0.02) return
    this.currentBoost = clamped
    this.rebuildMesh(clamped)
  }

  private rebuildMesh(boost: number): void {
    if (!this.rmv) {
      this.rmv = this.sceneObject.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    }
    const builder = new MeshBuilder([
      { name: "position", components: 3 },
      { name: "normal", components: 3, normalized: true },
      { name: "color", components: 4 },
    ])
    builder.topology = MeshTopology.Triangles
    builder.indexType = MeshIndexType.UInt16

    const indices: number[] = []
    let vi = 0

    const b = boost * 0.28
    const baseR = Math.min(1, this.primaryColor.r + b)
    const baseG = Math.min(1, this.primaryColor.g + b)
    const baseB = Math.min(1, this.primaryColor.b + b * 0.85)

    const woodMain: RGBA = [baseR, baseG, baseB, 1.0]
    const woodTrim: RGBA = [Math.min(1, baseR + 0.12), Math.min(1, baseG + 0.10), Math.min(1, baseB + 0.08), 1.0]
    const legCol: RGBA = [Math.max(0.12, baseR - 0.08), Math.max(0.10, baseG - 0.08), Math.max(0.10, baseB - 0.06), 1.0]

    if (this.furnitureKind === "table") {
      // Tabletop: 22 cm wide (hw=11), 1.4 cm thick (hh=0.7), 12 cm deep (hd=6), top at y = +6.0 cm
      vi = addBox(builder, indices, 0, 5.3, 0, 11.0, 0.7, 6.0, woodMain, vi)
      vi = addBox(builder, indices, 0, 6.05, 0, 10.6, 0.12, 5.6, woodTrim, vi)
      // 4 legs from y = -6 to y = +4.6
      const legOffsets: [number, number][] = [[-9.5, -4.6], [9.5, -4.6], [-9.5, 4.6], [9.5, 4.6]]
      for (const [lx, lz] of legOffsets) {
        vi = addBox(builder, indices, lx, -0.7, lz, 0.7, 5.3, 0.7, legCol, vi)
      }
      // Cross-stretcher bar
      vi = addBox(builder, indices, 0, -3.5, 0, 9.2, 0.35, 0.4, legCol, vi)
    } else if (this.furnitureKind === "chair") {
      const chairMain: RGBA = [Math.min(1, 0.28 + b), Math.min(1, 0.32 + b), Math.min(1, 0.40 + b), 1.0]
      const chairTrim: RGBA = [Math.min(1, 0.38 + b), Math.min(1, 0.42 + b), Math.min(1, 0.52 + b), 1.0]
      // Seat at y = 0 (8x1.0x8 cm)
      vi = addBox(builder, indices, 0, 0, 0, 4.2, 0.5, 4.2, chairMain, vi)
      // 4 legs down to y = -6
      const legs: [number, number][] = [[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]]
      for (const [lx, lz] of legs) {
        vi = addBox(builder, indices, lx, -3.0, lz, 0.45, 3.0, 0.45, legCol, vi)
      }
      // Backrest posts + 2 horizontal slats up to y = +6.5
      vi = addBox(builder, indices, -3.5, 3.4, -3.5, 0.45, 3.2, 0.45, chairTrim, vi)
      vi = addBox(builder, indices, 3.5, 3.4, -3.5, 0.45, 3.2, 0.45, chairTrim, vi)
      vi = addBox(builder, indices, 0, 5.5, -3.5, 3.8, 0.8, 0.35, chairTrim, vi)
      vi = addBox(builder, indices, 0, 3.2, -3.5, 3.8, 0.6, 0.35, chairMain, vi)
    } else if (this.furnitureKind === "shelf") {
      const shelfMain: RGBA = [Math.min(1, 0.32 + b), Math.min(1, 0.30 + b), Math.min(1, 0.38 + b), 1.0]
      const shelfTop: RGBA = [Math.min(1, 0.44 + b), Math.min(1, 0.42 + b), Math.min(1, 0.50 + b), 1.0]
      // Upper shelf deck at y = +1.5 (top at y = +2.0 cm), 15 cm wide, 8 cm deep
      vi = addBox(builder, indices, 0, 1.5, 0, 7.5, 0.5, 4.0, shelfTop, vi)
      // Lower shelf deck at y = -3.0
      vi = addBox(builder, indices, 0, -3.0, 0, 7.5, 0.45, 4.0, shelfMain, vi)
      // Side uprights
      vi = addBox(builder, indices, -7.2, -0.8, 0, 0.45, 3.2, 3.8, legCol, vi)
      vi = addBox(builder, indices, 7.2, -0.8, 0, 0.45, 3.2, 3.8, legCol, vi)
    } else {
      // "room_frame" — subtle 20 m² dark-room floor grid & corner rails so walking around in WASD feels grounded
      const floorCol: RGBA = [Math.min(1, 0.16 + b * 0.6), Math.min(1, 0.18 + b * 0.6), Math.min(1, 0.24 + b * 0.6), 1.0]
      const railCol: RGBA = [Math.min(1, 0.24 + b * 0.7), Math.min(1, 0.28 + b * 0.7), Math.min(1, 0.36 + b * 0.7), 1.0]
      // Floor base board at y = -16.5
      vi = addBox(builder, indices, 0, -16.5, 0, 23.0, 0.35, 13.0, floorCol, vi)
      // Back-wall horizontal dado rail and two corner pillars
      vi = addBox(builder, indices, 0, 14.0, -12.5, 23.0, 0.35, 0.35, railCol, vi)
      vi = addBox(builder, indices, -22.8, -1.0, -12.5, 0.35, 15.5, 0.35, railCol, vi)
      vi = addBox(builder, indices, 22.8, -1.0, -12.5, 0.35, 15.5, 0.35, railCol, vi)
    }

    builder.appendIndices(indices)
    this.rmv.mesh = builder.getMesh()
    if (this.material) {
      this.rmv.mainMaterial = this.material
    }
    builder.updateMesh()
  }
}

