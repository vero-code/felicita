/**
 * FelicitaLampMesh — Procedural 3D emergency lamp meshes with subtle inactive dot and animated active glow.
 *
 * Owns:
 * - Runtime MeshBuilder geometry for the 4 emergency light sources:
 *   1. "big_blue" (Big Blue Lamp, 400 lm)
 *   2. "white_handle" (White Lamp with Handle, 400 lm)
 *   3. "flashlight" (Emergency Flashlight, 250 lm)
 *   4. "candle" (LED Emergency Candle, 150 lm)
 * - Subtle low-contrast grey base dot when inactive, and animated glowing core when held or placed.
 *
 * Expects @input:
 * - material: vertexBaseColorMaterial from SimpleVertexBaseColor.lspkg
 * - lampKind: "big_blue" | "white_handle" | "flashlight" | "candle"
 */

type RGBA = [number, number, number, number]

function buildLathe(
  builder: MeshBuilder,
  profile: [number, number][],
  segments: number,
  color: RGBA,
  baseIdx: number = 0
): number {
  const P = profile.length
  let vi = baseIdx
  const startIdx = vi
  const indices: number[] = []

  const prof2dN: [number, number][] = []
  for (let j = 0; j < P; j++) {
    const prev = profile[Math.max(0, j - 1)]
    const next = profile[Math.min(P - 1, j + 1)]
    const dx = next[0] - prev[0], dy = next[1] - prev[1]
    const len = Math.hypot(dy, -dx) || 1
    prof2dN.push([dy / len, -dx / len])
  }

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2
    const c = Math.cos(theta), s = Math.sin(theta)
    for (let j = 0; j < P; j++) {
      const [r, y] = profile[j]
      const [n2x, n2y] = prof2dN[j]
      builder.appendVerticesInterleaved([
        r * c, y, r * s,
        n2x * c, n2y, n2x * s,
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

  if (profile[0][0] > 1e-6) {
    const y = profile[0][1], r = profile[0][0]
    const center = vi
    builder.appendVerticesInterleaved([0, y, 0, 0, -1, 0, ...color]); vi++
    const ring = vi
    for (let i = 0; i <= segments; i++) {
      const th = (i / segments) * Math.PI * 2
      builder.appendVerticesInterleaved([r * Math.cos(th), y, r * Math.sin(th), 0, -1, 0, ...color]); vi++
    }
    for (let i = 0; i < segments; i++) indices.push(center, ring + i, ring + i + 1)
  }

  if (profile[P - 1][0] > 1e-6) {
    const y = profile[P - 1][1], r = profile[P - 1][0]
    const center = vi
    builder.appendVerticesInterleaved([0, y, 0, 0, 1, 0, ...color]); vi++
    const ring = vi
    for (let i = 0; i <= segments; i++) {
      const th = (i / segments) * Math.PI * 2
      builder.appendVerticesInterleaved([r * Math.cos(th), y, r * Math.sin(th), 0, 1, 0, ...color]); vi++
    }
    for (let i = 0; i < segments; i++) indices.push(center, ring + i + 1, ring + i)
  }

  builder.appendIndices(indices)
  return vi
}

function buildTube(
  builder: MeshBuilder,
  curve: [number, number, number][],
  radius: number,
  radialSegments: number,
  color: RGBA,
  baseIdx: number = 0
): number {
  const N = curve.length
  if (N < 2) return baseIdx
  let vi = baseIdx
  const startIdx = vi

  const T: [number, number, number][] = []
  for (let i = 0; i < N; i++) {
    const a = curve[Math.max(0, i - 1)], b = curve[Math.min(N - 1, i + 1)]
    const t: [number, number, number] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    const len = Math.hypot(t[0], t[1], t[2]) || 1
    T.push([t[0] / len, t[1] / len, t[2] / len])
  }

  const ax: [number, number, number] = Math.abs(T[0][0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]
  const d0 = ax[0] * T[0][0] + ax[1] * T[0][1] + ax[2] * T[0][2]
  let Nf: [number, number, number] = [ax[0] - d0 * T[0][0], ax[1] - d0 * T[0][1], ax[2] - d0 * T[0][2]]
  const nl = Math.hypot(Nf[0], Nf[1], Nf[2]) || 1
  Nf = [Nf[0] / nl, Nf[1] / nl, Nf[2] / nl]

  const frames: { n: [number, number, number]; b: [number, number, number] }[] = []
  for (let i = 0; i < N; i++) {
    const t = T[i]
    const Bf: [number, number, number] = [
      t[1] * Nf[2] - t[2] * Nf[1],
      t[2] * Nf[0] - t[0] * Nf[2],
      t[0] * Nf[1] - t[1] * Nf[0],
    ]
    frames.push({ n: [...Nf] as [number, number, number], b: Bf })
  }

  const R = radialSegments + 1
  for (let i = 0; i < N; i++) {
    const p = curve[i], { n, b } = frames[i]
    for (let j = 0; j < R; j++) {
      const th = (j / radialSegments) * Math.PI * 2
      const c = Math.cos(th), s = Math.sin(th)
      const nx = n[0] * c + b[0] * s, ny = n[1] * c + b[1] * s, nz = n[2] * c + b[2] * s
      builder.appendVerticesInterleaved([
        p[0] + nx * radius, p[1] + ny * radius, p[2] + nz * radius,
        nx, ny, nz,
        ...color,
      ])
      vi++
    }
  }

  const indices: number[] = []
  for (let i = 0; i < N - 1; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const bl = startIdx + i * R + j
      const br = startIdx + i * R + (j + 1)
      const tl = startIdx + (i + 1) * R + j
      const tr = startIdx + (i + 1) * R + (j + 1)
      indices.push(bl, br, tr, bl, tr, tl)
    }
  }
  builder.appendIndices(indices)
  return vi
}

@component
export class FelicitaLampMesh extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">FelicitaLampMesh – Emergency battery lamp geometry</span>')
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
    new ComboBoxItem("Big Blue Lamp (400 lm)", "big_blue"),
    new ComboBoxItem("White Handle Lamp (400 lm)", "white_handle"),
    new ComboBoxItem("Flashlight (250 lm)", "flashlight"),
    new ComboBoxItem("Candle (150 lm)", "candle"),
  ]))
  @hint("Which emergency lamp model to construct")
  lampKind: string = "big_blue"
  @ui.group_end

  private bodySO!: SceneObject
  private glowSO!: SceneObject
  private dotSO!: SceneObject
  private isLit: boolean = false
  private isHeld: boolean = false
  private pulseTime: number = 0

  onAwake(): void {
    this.bodySO = global.scene.createSceneObject("LampVisualBody")
    this.bodySO.setParent(this.sceneObject)

    this.glowSO = global.scene.createSceneObject("LampGlowCore")
    this.glowSO.setParent(this.sceneObject)

    this.dotSO = global.scene.createSceneObject("LampSubtleDot")
    this.dotSO.setParent(this.sceneObject)

    this.buildVisuals(false)
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  public setLampActiveState(held: boolean, placed: boolean): void {
    this.isHeld = held
    this.isLit = held || placed
    if (this.dotSO) {
      // Inactive lamps show subtle grey dot; once held or placed, dot hides and lamp glows brightly
      this.dotSO.enabled = !this.isLit
    }
    this.buildVisuals(this.isLit)
  }

  private onUpdate(): void {
    if (!this.glowSO) return
    if (this.isLit) {
      this.pulseTime += getDeltaTime() * 4.0
      const s = 1.0 + 0.08 * Math.sin(this.pulseTime)
      this.glowSO.getTransform().setLocalScale(new vec3(s, s, s))
    } else {
      this.glowSO.getTransform().setLocalScale(new vec3(1, 1, 1))
    }
  }

  private buildVisuals(lit: boolean): void {
    // 1. Body mesh
    let bodyRmv = this.bodySO.getComponent("Component.RenderMeshVisual") as RenderMeshVisual | null
    if (!bodyRmv) bodyRmv = this.bodySO.createComponent("Component.RenderMeshVisual") as RenderMeshVisual

    const bodyBuilder = new MeshBuilder([
      { name: "position", components: 3 },
      { name: "normal", components: 3, normalized: true },
      { name: "color", components: 4 },
    ])
    bodyBuilder.topology = MeshTopology.Triangles
    bodyBuilder.indexType = MeshIndexType.UInt16

    // 2. Glow emitter mesh
    let glowRmv = this.glowSO.getComponent("Component.RenderMeshVisual") as RenderMeshVisual | null
    if (!glowRmv) glowRmv = this.glowSO.createComponent("Component.RenderMeshVisual") as RenderMeshVisual

    const glowBuilder = new MeshBuilder([
      { name: "position", components: 3 },
      { name: "normal", components: 3, normalized: true },
      { name: "color", components: 4 },
    ])
    glowBuilder.topology = MeshTopology.Triangles
    glowBuilder.indexType = MeshIndexType.UInt16

    const mult = lit ? 1.0 : 0.65

    if (this.lampKind === "big_blue") {
      const blueBody: RGBA = [0.18 * mult, 0.52 * mult, 0.95 * mult, 1.0]
      const capCol: RGBA = [0.22 * mult, 0.28 * mult, 0.38 * mult, 1.0]
      let vi = 0
      vi = buildLathe(bodyBuilder, [
        [0.0, 0.0], [2.2, 0.0], [2.3, 0.8], [2.0, 2.8], [2.3, 3.2], [0.0, 3.2]
      ], 20, blueBody, vi)
      vi = buildLathe(bodyBuilder, [
        [0.0, 5.2], [2.2, 5.2], [1.6, 5.9], [0.0, 5.9]
      ], 20, capCol, vi)

      const bulbCol: RGBA = lit ? [0.72, 0.96, 1.0, 1.0] : [0.42, 0.52, 0.62, 1.0]
      buildLathe(glowBuilder, [
        [1.7, 3.1], [1.85, 4.2], [1.7, 5.25]
      ], 20, bulbCol, 0)
    } else if (this.lampKind === "white_handle") {
      const whiteBody: RGBA = [0.85 * mult, 0.88 * mult, 0.94 * mult, 1.0]
      let vi = 0
      vi = buildLathe(bodyBuilder, [
        [0.0, 0.0], [2.0, 0.0], [2.1, 2.4], [1.5, 2.8], [0.0, 2.8]
      ], 20, whiteBody, vi)
      // Curved handle arch on top
      const arch: [number, number, number][] = []
      for (let k = 0; k <= 12; k++) {
        const a = (k / 12) * Math.PI
        arch.push([Math.cos(a) * 1.5, 4.4 + Math.sin(a) * 1.4, 0])
      }
      vi = buildTube(bodyBuilder, arch, 0.24, 8, whiteBody, vi)

      const bulbCol: RGBA = lit ? [1.0, 0.95, 0.76, 1.0] : [0.55, 0.55, 0.58, 1.0]
      buildLathe(glowBuilder, [
        [1.4, 2.7], [1.8, 3.7], [1.2, 4.6], [0.0, 4.7]
      ], 20, bulbCol, 0)
    } else if (this.lampKind === "flashlight") {
      const slateCol: RGBA = [0.35 * mult, 0.42 * mult, 0.52 * mult, 1.0]
      buildLathe(bodyBuilder, [
        [0.0, 0.0], [1.1, 0.0], [1.1, 3.0], [1.85, 4.3], [0.0, 4.3]
      ], 18, slateCol, 0)

      const beamCol: RGBA = lit ? [0.95, 0.98, 0.78, 1.0] : [0.48, 0.50, 0.54, 1.0]
      buildLathe(glowBuilder, [
        [0.0, 4.3], [1.65, 4.35], [2.1, 5.4], [0.0, 5.4]
      ], 18, beamCol, 0)
    } else {
      // "candle"
      const waxCol: RGBA = [0.90 * mult, 0.86 * mult, 0.74 * mult, 1.0]
      buildLathe(bodyBuilder, [
        [0.0, 0.0], [1.35, 0.0], [1.3, 3.4], [0.2, 3.5], [0.0, 3.5]
      ], 18, waxCol, 0)

      const flameCol: RGBA = lit ? [1.0, 0.80, 0.28, 1.0] : [0.55, 0.48, 0.38, 1.0]
      buildLathe(glowBuilder, [
        [0.0, 3.5], [0.55, 4.0], [0.35, 4.8], [0.0, 5.3]
      ], 16, flameCol, 0)
    }

    bodyRmv.mesh = bodyBuilder.getMesh()
    glowRmv.mesh = glowBuilder.getMesh()
    if (this.material) {
      bodyRmv.mainMaterial = this.material
      glowRmv.mainMaterial = this.material
    }
    bodyBuilder.updateMesh()
    glowBuilder.updateMesh()

    // 3. Subtle low-contrast grey base dot (2.5 cm radius = 5 cm diameter)
    let dotRmv = this.dotSO.getComponent("Component.RenderMeshVisual") as RenderMeshVisual | null
    if (!dotRmv) dotRmv = this.dotSO.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    const dotBuilder = new MeshBuilder([
      { name: "position", components: 3 },
      { name: "normal", components: 3, normalized: true },
      { name: "color", components: 4 },
    ])
    dotBuilder.topology = MeshTopology.Triangles
    dotBuilder.indexType = MeshIndexType.UInt16
    buildLathe(dotBuilder, [
      [0.0, -0.15], [2.5, -0.15], [2.5, 0.05], [0.0, 0.05]
    ], 18, [0.46, 0.50, 0.56, 1.0], 0)
    dotRmv.mesh = dotBuilder.getMesh()
    if (this.material) dotRmv.mainMaterial = this.material
    dotBuilder.updateMesh()
  }
}

