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
      // Room-scale Table matching Evening Room furniture scale: 68 cm wide (hw=34), 42 cm deep (hd=21)
      // Tabletop top surface at local y = +18.0 cm; 4 clean legs reach floor at local y = -32.0 cm (50 cm total height)
      vi = addBox(builder, indices, 0, 16.4, 0, 34.0, 1.6, 21.0, woodMain, vi)
      vi = addBox(builder, indices, 0, 18.0, 0, 32.8, 0.25, 19.8, woodTrim, vi)
      const legOffsets: [number, number][] = [[-29.5, -16.5], [29.5, -16.5], [-29.5, 16.5], [29.5, 16.5]]
      for (const [lx, lz] of legOffsets) {
        vi = addBox(builder, indices, lx, -8.6, lz, 2.0, 23.4, 2.0, legCol, vi)
      }
    } else if (this.furnitureKind === "chair") {
      const chairMain: RGBA = [Math.min(1, 0.28 + b), Math.min(1, 0.32 + b), Math.min(1, 0.40 + b), 1.0]
      const chairTrim: RGBA = [Math.min(1, 0.38 + b), Math.min(1, 0.42 + b), Math.min(1, 0.52 + b), 1.0]
      // Room-scale Chair matching Evening Room armchair scale: 36x36 cm seat (hw=18, hd=18) at local y = 0 (top surface at y = +1.5 cm)
      vi = addBox(builder, indices, 0, 0, 0, 18.0, 1.5, 18.0, chairMain, vi)
      // 4 legs down to local y = -30.0 cm
      const legs: [number, number][] = [[-14.8, -14.8], [14.8, -14.8], [-14.8, 14.8], [14.8, 14.8]]
      for (const [lx, lz] of legs) {
        vi = addBox(builder, indices, lx, -15.0, lz, 1.6, 15.0, 1.6, legCol, vi)
      }
      // Backrest posts + 2 horizontal slats up to local y = +28.0 cm
      vi = addBox(builder, indices, -14.8, 14.0, -14.8, 1.6, 13.5, 1.6, chairTrim, vi)
      vi = addBox(builder, indices, 14.8, 14.0, -14.8, 1.6, 13.5, 1.6, chairTrim, vi)
      vi = addBox(builder, indices, 0, 23.5, -14.8, 16.4, 3.2, 1.3, chairTrim, vi)
      vi = addBox(builder, indices, 0, 13.5, -14.8, 16.4, 2.6, 1.3, chairMain, vi)
    } else if (this.furnitureKind === "shelf") {
      const shelfMain: RGBA = [Math.min(1, 0.32 + b), Math.min(1, 0.30 + b), Math.min(1, 0.38 + b), 1.0]
      const shelfTop: RGBA = [Math.min(1, 0.44 + b), Math.min(1, 0.42 + b), Math.min(1, 0.50 + b), 1.0]
      // Room-scale Wall Shelf: 52 cm wide (hw=26), 22 cm deep (hd=11)
      // Upper shelf deck at local y = +5.2 cm (top surface at y = +6.5 cm)
      vi = addBox(builder, indices, 0, 5.2, 0, 26.0, 1.3, 11.0, shelfTop, vi)
      // Lower shelf deck at local y = -9.5 cm
      vi = addBox(builder, indices, 0, -9.5, 0, 26.0, 1.2, 11.0, shelfMain, vi)
      // Side uprights
      vi = addBox(builder, indices, -24.4, -2.0, 0, 1.4, 9.8, 10.2, legCol, vi)
      vi = addBox(builder, indices, 24.4, -2.0, 0, 1.4, 9.8, 10.2, legCol, vi)
    }

    builder.appendIndices(indices)
    this.rmv.mesh = builder.getMesh()
    if (this.material) {
      this.rmv.mainMaterial = this.material
    }
    builder.updateMesh()
  }
}

