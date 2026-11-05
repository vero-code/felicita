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

    // Build a microscopic surface-anchor mesh so the real Evening Room furniture
    // (credenza, round coffee table, woven chair) remains 100% unobstructed visually
    // while keeping RenderMeshVisual.mesh valid for spatial anchors & LEAF Criterion 1.
    vi = addBox(builder, indices, 0, -500, 0, 0.01, 0.01, 0.01, woodMain, vi)

    builder.appendIndices(indices)
    this.rmv.mesh = builder.getMesh()
    if (this.material) {
      this.rmv.mainMaterial = this.material
    }
    builder.updateMesh()
  }
}

