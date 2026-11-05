/**
 * FelicitaAudioController — Low-latency SFX playback helper for Felicita interactions.
 *
 * Owns:
 * - AudioComponent creation and LowLatency playback for LampPickup, LampPlace, and StoreOpen cues.
 *
 * Must not:
 * - Create UI or mutate game state.
 */

const pickupTrack = requireAsset("../GeneratedSFX/LampPickup.wav") as AudioTrackAsset
const placeTrack = requireAsset("../GeneratedSFX/LampPlace.wav") as AudioTrackAsset
const storeTrack = requireAsset("../GeneratedSFX/StoreOpen.wav") as AudioTrackAsset

export class FelicitaAudioController {
  private pickupAudio: AudioComponent
  private placeAudio: AudioComponent
  private storeAudio: AudioComponent

  constructor(host: SceneObject) {
    const sfxRoot = global.scene.createSceneObject("FelicitaAudioRig")
    sfxRoot.setParent(host)

    this.pickupAudio = this.createLowLatencyAudio(sfxRoot, "PickupSFX", pickupTrack, 0.75)
    this.placeAudio = this.createLowLatencyAudio(sfxRoot, "PlaceSFX", placeTrack, 0.85)
    this.storeAudio = this.createLowLatencyAudio(sfxRoot, "StoreSFX", storeTrack, 0.80)
  }

  public playPickup(): void {
    if (this.pickupAudio && this.pickupAudio.audioTrack) {
      this.pickupAudio.play(1)
    }
  }

  public playPlace(): void {
    if (this.placeAudio && this.placeAudio.audioTrack) {
      this.placeAudio.play(1)
    }
  }

  public playStoreOpen(): void {
    if (this.storeAudio && this.storeAudio.audioTrack) {
      this.storeAudio.play(1)
    }
  }

  private createLowLatencyAudio(
    parent: SceneObject,
    name: string,
    track: AudioTrackAsset,
    volume: number
  ): AudioComponent {
    const so = global.scene.createSceneObject(name)
    so.setParent(parent)
    const comp = so.createComponent("Component.AudioComponent") as AudioComponent
    comp.playbackMode = Audio.PlaybackMode.LowLatency
    comp.audioTrack = track
    comp.volume = volume
    return comp
  }
}

