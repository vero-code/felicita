/**
 * FelicitaStatusHudUI — Floating Room Light Status readout and Voice Fallback room area buttons.
 *
 * Owns:
 * - Room lumen & coverage readout (e.g. "+800 lumens / 20 m² covered")
 * - Guidance hint row for hand interaction state
 * - Voice fallback room area buttons ("15 m²", "20 m²", "30 m²") and "Reset" button
 *
 * Expects @input:
 * -Settings tunables (panelWidthCm, panelHeightCm, defaultTitle, primaryTextColor, accentTextColor)
 *
 * Must not:
 * - Hold domain state or manipulate 3D lamp transforms directly
 */

import Event, { PublicApi } from "SpectaclesInteractionKit.lspkg/Utils/Event"
import { BackPlate } from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import { Button } from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import { FlexItem } from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import { FlexLayout } from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {
  FlexAlign,
  FlexAlignSelf,
  FlexDirection,
  FlexJustify,
} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"

const imageMaterial = requireAsset("../Materials/ImageMaterial.mat") as Material
const lightbulbIcon = requireAsset("../Icons/lightbulb.png") as Texture
const refreshIcon = requireAsset("../Icons/refresh.png") as Texture

const FONT_SIZE_SCALE = 1.0

type TextRole =
  | "Title1" | "Title2" | "HeadlineXL" | "Headline1" | "Headline2"
  | "Subheadline" | "Button" | "Callout" | "Body" | "Caption"

const TYPE_SCALE: Record<TextRole, { size: number; weight: number }> = {
  Title1:      { size: 105, weight: 700 },
  Title2:      { size: 93,  weight: 700 },
  HeadlineXL:  { size: 62,  weight: 700 },
  Headline1:   { size: 54,  weight: 700 },
  Headline2:   { size: 48,  weight: 700 },
  Subheadline: { size: 41,  weight: 700 },
  Button:      { size: 39,  weight: 500 },
  Callout:     { size: 39,  weight: 700 },
  Body:        { size: 39,  weight: 500 },
  Caption:     { size: 38,  weight: 500 },
}

function roleSize(role: TextRole, distanceCm: number = 110): number {
  return TYPE_SCALE[role].size * FONT_SIZE_SCALE * (distanceCm / 110)
}

function applyTextRole(t: Text, role: TextRole, distanceCm: number = 110): void {
  t.size = roleSize(role, distanceCm)
  ;(t as Text & { weight?: number }).weight = TYPE_SCALE[role].weight
}

const BUTTON_LABEL_Z = 0.08

@component
export class FelicitaStatusHudUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">FelicitaStatusHudUI – Room light status & area selector</span>')
  @ui.separator

  @ui.group_start("Settings")
  @input
  @widget(new SliderWidget(24, 42, 1))
  @hint("Width of the Room Light Status HUD panel in centimeters")
  panelWidthCm: number = 32

  @input
  @widget(new SliderWidget(9, 18, 0.5))
  @hint("Height of the Room Light Status HUD panel in centimeters")
  panelHeightCm: number = 11.5

  @input
  @hint("Header title shown on the Room Light Status HUD")
  headerTitle: string = "Felicita — Spatial Light Planner"

  @input("vec4", "{1.0, 1.0, 1.0, 1.0}")
  @widget(new ColorWidget())
  @hint("Primary text color (bright white for additive display)")
  primaryTextColor: vec4 = new vec4(1.0, 1.0, 1.0, 1.0)

  @input("vec4", "{0.55, 0.92, 1.0, 1.0}")
  @widget(new ColorWidget())
  @hint("Accent text color for lumen counter readout")
  accentTextColor: vec4 = new vec4(0.55, 0.92, 1.0, 1.0)
  @ui.group_end

  private lumenText!: Text
  private hintText!: Text

  private _onSelectArea = new Event<number>()
  private _onResetRoom = new Event<void>()

  get onSelectArea(): PublicApi<number> {
    return this._onSelectArea.publicApi()
  }

  get onResetRoom(): PublicApi<void> {
    return this._onResetRoom.publicApi()
  }

  onAwake(): void {
    this.sceneObject.createComponent("Component.Canvas")

    const backPlate = this.sceneObject.createComponent(BackPlate.getTypeName()) as BackPlate
    backPlate.size = new vec2(this.panelWidthCm, this.panelHeightCm)

    const content = global.scene.createSceneObject("Content")
    content.setParent(this.sceneObject)
    content.getTransform().setLocalPosition(new vec3(0, 0, 0.6))

    const col = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    col.autoDiscoverItemsOnStart = false
    col.width = this.panelWidthCm
    col.height = this.panelHeightCm
    col.direction = FlexDirection.Column
    col.alignItems = FlexAlign.Stretch
    col.justifyContent = FlexJustify.Center
    col.rowGap = 0.65
    col.paddingTop = 1.0
    col.paddingBottom = 1.0
    col.paddingLeft = 1.2
    col.paddingRight = 1.2

    col.onLayoutComplete.add((r) => {
      if (r.containerWidth > 0 && r.containerHeight > 0) {
        backPlate.size = new vec2(
          Math.max(this.panelWidthCm, r.containerWidth),
          Math.max(this.panelHeightCm, r.containerHeight)
        )
      }
    })

    const colItems: FlexItem[] = []

    // Row 1: Icon + Title
    const headerRow = global.scene.createSceneObject("HeaderRow")
    headerRow.setParent(content)
    const headerFlex = headerRow.createComponent(FlexLayout.getTypeName()) as FlexLayout
    headerFlex.autoDiscoverItemsOnStart = false
    headerFlex.direction = FlexDirection.Row
    headerFlex.alignItems = FlexAlign.Center
    headerFlex.justifyContent = FlexJustify.Center
    headerFlex.columnGap = 0.6
    headerFlex.width = this.panelWidthCm - 2.4
    headerFlex.height = 2.0
    const headerItem = headerRow.createComponent(FlexItem.getTypeName()) as FlexItem
    headerItem.alignSelf = FlexAlignSelf.Stretch
    headerItem.overrideHeight = 2.0
    colItems.push(headerItem)

    const headerRowItems: FlexItem[] = []
    headerRowItems.push(this.addImageItem(headerRow, "HudLampIcon", lightbulbIcon, 1.6))
    headerRowItems.push(
      this.addRowTextItem(headerRow, "HudHeaderText", this.headerTitle, "Subheadline", 22.0, this.primaryTextColor).item
    )
    headerRowItems.push(this.addImageItem(headerRow, "HudRefreshIcon", refreshIcon, 1.3))
    headerFlex.addItems(headerRowItems)

    // Row 2: Room Lumen Readout (e.g. "+0 lumens / 20 m² covered")
    const lumenRow = this.addColumnTextRow(
      content,
      "LumenStatusText",
      "+0 lumens / 20 m² covered",
      "Headline1",
      2.3,
      this.accentTextColor
    )
    this.lumenText = lumenRow.text
    colItems.push(lumenRow.item)

    // Row 3: Hint / Instruction line
    const hintRow = this.addColumnTextRow(
      content,
      "HintStatusText",
      "Pinch & drag a lamp to a surface spot, or gaze into dark corner",
      "Caption",
      1.6,
      new vec4(1.0, 1.0, 1.0, 0.85)
    )
    this.hintText = hintRow.text
    colItems.push(hintRow.item)

    // Row 4: Voice fallback room area selection buttons + Reset button
    const btnRow = global.scene.createSceneObject("AreaButtonsRow")
    btnRow.setParent(content)
    const btnFlex = btnRow.createComponent(FlexLayout.getTypeName()) as FlexLayout
    btnFlex.autoDiscoverItemsOnStart = false
    btnFlex.direction = FlexDirection.Row
    btnFlex.alignItems = FlexAlign.Center
    btnFlex.justifyContent = FlexJustify.Center
    btnFlex.columnGap = 0.7
    btnFlex.width = this.panelWidthCm - 2.4
    btnFlex.height = 2.8
    const btnRowItem = btnRow.createComponent(FlexItem.getTypeName()) as FlexItem
    btnRowItem.alignSelf = FlexAlignSelf.Stretch
    btnRowItem.overrideHeight = 2.8
    colItems.push(btnRowItem)

    const btnItems: FlexItem[] = []
    btnItems.push(this.addButtonItem(btnRow, "Area10Button", "10 m²", 6.2, 2.4, () => this._onSelectArea.invoke(10)))
    btnItems.push(this.addButtonItem(btnRow, "Area15Button", "15 m²", 6.2, 2.4, () => this._onSelectArea.invoke(15)))
    btnItems.push(this.addButtonItem(btnRow, "Area20Button", "20 m²", 6.2, 2.4, () => this._onSelectArea.invoke(20)))
    btnItems.push(this.addButtonItem(btnRow, "ResetRoomButton", "Reset", 6.2, 2.4, () => this._onResetRoom.invoke()))
    btnFlex.addItems(btnItems)

    col.addItems(colItems)
  }

  public setIllumination(lumens: number, areaSqM: number, placedCount: number, totalSpots: number): void {
    if (!this.lumenText) return
    const sign = lumens >= 0 ? "+" : ""
    this.lumenText.text = `${sign}${lumens} lumens / ${areaSqM} m² covered (${placedCount}/${totalSpots} spots)`
  }

  public setGuidance(hint: string): void {
    if (!this.hintText) return
    this.hintText.text = hint
  }

  private addColumnTextRow(
    parent: SceneObject,
    objName: string,
    initialText: string,
    role: TextRole,
    heightCm: number,
    color: vec4
  ): { text: Text; item: FlexItem } {
    const so = global.scene.createSceneObject(objName)
    so.setParent(parent)
    const t = so.createComponent("Component.Text") as Text
    t.text = initialText
    t.depthTest = true
    applyTextRole(t, role)
    t.textFill.color = color
    t.horizontalAlignment = HorizontalAlignment.Center
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Overflow
    t.verticalOverflow = VerticalOverflow.Overflow
    t.layoutRect = Rect.create(-0.5, 0.5, -0.5, 0.5)

    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.alignSelf = FlexAlignSelf.Stretch
    item.overrideHeight = heightCm
    return { text: t, item }
  }

  private addRowTextItem(
    parent: SceneObject,
    objName: string,
    textStr: string,
    role: TextRole,
    widthCm: number,
    color: vec4
  ): { text: Text; item: FlexItem } {
    const so = global.scene.createSceneObject(objName)
    so.setParent(parent)
    const t = so.createComponent("Component.Text") as Text
    t.text = textStr
    t.depthTest = true
    applyTextRole(t, role)
    t.textFill.color = color
    t.horizontalAlignment = HorizontalAlignment.Center
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Overflow
    t.verticalOverflow = VerticalOverflow.Overflow
    t.layoutRect = Rect.create(-widthCm / 2, widthCm / 2, -1.0, 1.0)

    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = widthCm
    item.overrideHeight = 2.0
    return { text: t, item }
  }

  private addImageItem(parent: SceneObject, objName: string, tex: Texture, sizeCm: number): FlexItem {
    const so = global.scene.createSceneObject(objName)
    so.setParent(parent)
    const img = so.createComponent("Component.Image") as Image
    const mat = imageMaterial.clone()
    mat.mainPass.baseTex = tex
    mat.mainPass.depthTest = true
    mat.mainPass.depthWrite = false
    img.clearMaterials()
    img.addMaterial(mat)
    so.getTransform().setLocalScale(new vec3(sizeCm, sizeCm, 1))
    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = sizeCm
    item.overrideHeight = sizeCm
    return item
  }

  private addButtonItem(
    parent: SceneObject,
    btnName: string,
    labelText: string,
    sizeXCM: number,
    sizeYCM: number,
    onClick: () => void
  ): FlexItem {
    const so = global.scene.createSceneObject(btnName)
    so.setParent(parent)
    const btn = so.createComponent(Button.getTypeName()) as Button
    btn.size = new vec3(sizeXCM, sizeYCM, 1)
    btn.onInitialized.add(() => {
      btn.size = new vec3(sizeXCM, sizeYCM, 1)
    })

    const labelSO = global.scene.createSceneObject(`${btnName}Label`)
    labelSO.setParent(so)
    labelSO.getTransform().setLocalPosition(new vec3(0, 0, BUTTON_LABEL_Z))
    const t = labelSO.createComponent("Component.Text") as Text
    t.text = labelText
    t.depthTest = true
    applyTextRole(t, "Button")
    t.textFill.color = this.primaryTextColor
    t.horizontalAlignment = HorizontalAlignment.Center
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Overflow
    t.verticalOverflow = VerticalOverflow.Overflow
    const labelW = sizeXCM - 0.5
    t.layoutRect = Rect.create(-labelW / 2, labelW / 2, -1.0, 1.0)
    labelSO.createComponent(FlexItem.getTypeName())

    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = sizeXCM
    item.overrideHeight = sizeYCM
    btn.onTriggerUp.add(onClick)
    return item
  }
}
