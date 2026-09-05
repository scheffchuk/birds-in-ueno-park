function resetAudioElement(audio: HTMLAudioElement): void {
  audio.pause();
  audio.currentTime = 0;
  audio.removeAttribute("src");
  audio.load();
}

/** Coordinates the one-active-recording rule for a rendered Atlas list. */
export class AudioPlaybackCoordinator {
  private readonly audioBySlug = new Map<string, HTMLAudioElement>();
  private activeSlug: string | null = null;

  register(slug: string, audio: HTMLAudioElement | null): void {
    if (audio) {
      this.audioBySlug.set(slug, audio);
      return;
    }
    if (this.activeSlug === slug) this.activeSlug = null;
    const removed = this.audioBySlug.get(slug);
    if (removed) resetAudioElement(removed);
    this.audioBySlug.delete(slug);
  }

  requestPlay(slug: string): void {
    if (this.activeSlug && this.activeSlug !== slug) {
      const previous = this.audioBySlug.get(this.activeSlug);
      if (previous) resetAudioElement(previous);
    }
    this.activeSlug = slug;
  }

  release(slug: string): void {
    if (this.activeSlug === slug) this.activeSlug = null;
  }

  stop(slug: string): void {
    const audio = this.audioBySlug.get(slug);
    if (audio) resetAudioElement(audio);
    this.release(slug);
  }

  dispose(): void {
    for (const audio of this.audioBySlug.values()) resetAudioElement(audio);
    this.audioBySlug.clear();
    this.activeSlug = null;
  }
}
