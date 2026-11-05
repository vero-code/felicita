/**
 * FelicitaEmergencyStoreUI — Compact floating Emergency Lamp Store Card (30 cm × 20 cm).
 *
 * Owns:
 * - Floating store card ("No lamp? Order delivery today") appearing when dark corner marker is pinched with empty hands
 * - Disappears when closed or when a lamp is picked up
 * - "Order Lamp" and "Close" UIKit Buttons
 *
 * Expects @input:
 * - cardWidthCm (default 30 cm), cardHeightCm (default 20 cm), headlineText, subText
 *
 * Must not:
 * - Mutate 3D scene lamps directly; communicates via onOrderLamp / onCloseStore events
 */

import Event, { PublicApi } from "SpectaclesInteractionKit.lspkg/Utils/Event"
import { Button } from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import { Frame } from "SpectaclesUIKit.lspkg/Scripts/Components/Frame/Frame"
import { FlexItem } from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import { FlexLayout } from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {
  FlexAlign,
  FlexAlignSelf,
  FlexDirection,
  FlexJustify,
} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"

const imageMaterial = requireAsset("../Materials/ImageMaterial.mat") as Material
const cartIcon = requireAsset("../Icons/shopping_cart.png") as Texture
const closeIcon = requireAsset("../Icons/close.png") as Texture

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
export class FelicitaEmergencyStoreUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">FelicitaEmergencyStoreUI – Emergency lamp store card (30×20 cm)</span>')
  @ui.separator

  @ui.group_start("Settings")
  @input
  @widget(new SliderWidget(24, 38, 1))
  @hint("Width of the compact floating emergency store card in centimeters")
  cardWidthCm: number = 30

  @input
  @widget(new SliderWidget(16, 26, 1))
  @hint("Height of the compact floating emergency store card in centimeters")
  cardHeightCm: number = 20

  @input
  @hint("Primary call-to-action title on the emergency store card")
  headlineText: string = "No lamp? Order delivery today"

  @input
  @hint("Product description shown on the emergency store card")
  productDescription: string = "Express Battery Lantern (+400 lm) · 15 min courier"

  @input("vec4", "{1.0, 0.92, 0.60, 1.0}")
  @widget(new ColorWidget())
  @hint("Highlight color for the store card header")
  headerColor: vec4 = new vec4(1.0, 0.92, 0.60, 1.0)
  @ui.group_end

  private titleText!: Text
  private descText!: Text
  private statusText!: Text
  private wantVisible: boolean = false

  private _onOrderLamp = new Event<void>()
  private _onCloseStore = new Event<void>()

  get onOrderLamp(): PublicApi<void> {
    return this._onOrderLamp.publicApi()
  }

  get onCloseStore(): PublicApi<void> {
    return this._onCloseStore.publicApi()
  }

  onAwake(): void {
    this.sceneObject.createComponent("Component.Canvas")

    const frame = this.sceneObject.createComponent(Frame.getTypeName()) as Frame
    frame.autoShowHide = false
    frame.autoScaleContent = false
    frame.allowScaling = false

    const content = global.scene.createSceneObject("StoreCardContent")
    content.setParent(this.sceneObject)
    content.getTransform().setLocalPosition(new vec3(0, 0, 0.6))

    frame.onInitialized.add(() => {
      frame.innerSize = new vec2(this.cardWidthCm, this.cardHeightCm)
      frame.padding = new vec2(1.4, 1.4)

      const col = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
      col.autoDiscoverItemsOnStart = false
      col.width = this.cardWidthCm
      col.height = this.cardHeightCm
      col.direction = FlexDirection.Column
      col.alignItems = FlexAlign.Stretch
      col.justifyContent = FlexJustify.Center
      col.rowGap = 0.9
      col.paddingTop = 1.2
      col.paddingBottom = 1.2
      col.paddingLeft = 1.4
      col.paddingRight = 1.4

      const colItems: FlexItem[] = []

      // Row 1: Icon + Header ("No lamp? Order delivery today")
      const headerRow = global.scene.createSceneObject("StoreHeaderRow")
      headerRow.setParent(content)
      const headerFlex = headerRow.createComponent(FlexLayout.getTypeName()) as FlexLayout
      headerFlex.autoDiscoverItemsOnStart = false
      headerFlex.direction = FlexDirection.Row
      headerFlex.alignItems = FlexAlign.Center
      headerFlex.justifyContent = FlexJustify.Center
      headerFlex.columnGap = 0.7
      headerFlex.width = this.cardWidthCm - 2.8
      headerFlex.height = 2.6
      const headerRowItem = headerRow.createComponent(FlexItem.getTypeName()) as FlexItem
      headerRowItem.alignSelf = FlexAlignSelf.Stretch
      headerRowItem.overrideHeight = 2.6
      colItems.push(headerRowItem)

      const headerItems: FlexItem[] = []
      headerItems.push(this.addImageItem(headerRow, "StoreCartIcon", cartIcon, 2.0))
      const titleCell = this.addRowTextItem(
        headerRow,
        "StoreTitleText",
        this.headlineText,
        "Headline2",
        22.5,
        this.headerColor
      )
      this.titleText = titleCell.text
      headerItems.push(titleCell.item)
      headerItems.push(this.addImageItem(headerRow, "StoreCloseIcon", closeIcon, 1.6))
      headerFlex.addItems(headerItems)

      // Row 2: Product description
      const descRow = this.addColumnTextRow(
        content,
        "StoreItemText",
        this.productDescription,
        "Body",
        2.4,
        new vec4(1.0, 1.0, 1.0, 0.95)
      )
      this.descText = descRow.text
      colItems.push(descRow.item)

      // Row 3: Status / Corner note
      const statusRow = this.addColumnTextRow(
        content,
        "StoreStatusText",
        "Unlit corner targeted with empty hands",
        "Caption",
        2.0,
        new vec4(0.65, 0.92, 1.0, 0.9)
      )
      this.statusText = statusRow.text
      colItems.push(statusRow.item)

      // Row 4: Action buttons ("Order Lamp", "Close")
      const actionsRow = global.scene.createSceneObject("StoreButtonsRow")
      actionsRow.setParent(content)
      const actionsFlex = actionsRow.createComponent(FlexLayout.getTypeName()) as FlexLayout
      actionsFlex.autoDiscoverItemsOnStart = false
      actionsFlex.direction = FlexDirection.Row
      actionsFlex.alignItems = FlexAlign.Center
      actionsFlex.justifyContent = FlexJustify.Center
      actionsFlex.columnGap = 1.4
      actionsFlex.width = this.cardWidthCm - 2.8
      actionsFlex.height = 3.2
      const actionsRowItem = actionsRow.createComponent(FlexItem.getTypeName()) as FlexItem
      actionsRowItem.alignSelf = FlexAlignSelf.Stretch
      actionsRowItem.overrideHeight = 3.2
      colItems.push(actionsRowItem)

      const btnItems: FlexItem[] = []
      btnItems.push(
        this.addButtonItem(actionsRow, "OrderLampButton", "Order Lamp", 11.5, 2.8, () => {
          this.setOrderConfirmed("Order confirmed! +400 lm emergency lamp dispatched")
          this._onOrderLamp.invoke()
        })
      )
      btnItems.push(
        this.addButtonItem(actionsRow, "CloseStoreButton", "Close", 8.5, 2.8, () => {
          this.hideStoreCard()
          this._onCloseStore.invoke()
        })
      )
      actionsFlex.addItems(btnItems)

      col.addItems(colItems)

      // Per G3: gate initial visibility at the tail of frame.onInitialized
      this.sceneObject.enabled = this.wantVisible
    })
  }

  public showStoreCard(statusNote?: string): void {
    this.wantVisible = true
    this.sceneObject.enabled = true
    if (statusNote && this.statusText) {
      this.statusText.text = statusNote
    }
  }

  public hideStoreCard(): void {
    this.wantVisible = false
    this.sceneObject.enabled = false
  }

  public isStoreVisible(): boolean {
    return this.wantVisible && this.sceneObject.enabled
  }

  public setOrderConfirmed(msg: string): void {
    if (this.statusText) {
      this.statusText.text = msg
    }
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
    t.layoutRect = Rect.create(-widthCm / 2, widthCm / 2, -1.2, 1.2)

    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = widthCm
    item.overrideHeight = 2.4
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
    t.textFill.color = new vec4(1, 1, 1, 1)
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
