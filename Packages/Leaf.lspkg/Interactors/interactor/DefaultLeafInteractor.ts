/**
 * LEAF Framework - DefaultLeafInteractor
 */
import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { sleep } from "../../Utils/common/Utils";

export class DefaultLeafInteractor {
    public async trigger(interactable: Interactable): Promise<void> {
        if (!interactable) {
            throw new Error("[DefaultLeafInteractor] Cannot trigger null interactable");
        }
        // Invoke trigger start
        try {
            (interactable as any).onTriggerStartEvent?.invoke({
                interactor: this,
                interactable: interactable,
                target: interactable.sceneObject
            });
        } catch (e) {}

        await sleep(150);

        // Invoke trigger end
        try {
            (interactable as any).onTriggerEndEvent?.invoke({
                interactor: this,
                interactable: interactable,
                target: interactable.sceneObject
            });
        } catch (e) {}
    }

    public async drag(interactable: Interactable, offset: vec3, durationMs: number = 200): Promise<void> {
        await this.trigger(interactable);
        const transform = interactable.sceneObject.getTransform();
        const start = transform.getLocalPosition();
        transform.setLocalPosition(start.add(offset));
        await sleep(durationMs);
    }
}

