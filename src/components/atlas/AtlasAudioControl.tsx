"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioLinesIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
  SquareIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AudioControlState = "idle" | "loading" | "playing" | "paused" | "error";

export type AtlasAudioLabels = {
  play: string;
  pause: string;
  loading: string;
  retry: string;
  unavailable: string;
};

export function AtlasAudioControl({
  audioUrl,
  available,
  labels,
  onPlayRequest,
  onPause,
  onEnded,
  onError,
  onAudioElement,
}: {
  audioUrl?: string;
  available: boolean;
  labels: AtlasAudioLabels;
  onPlayRequest?: (audio: HTMLAudioElement) => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: () => void;
  onAudioElement?: (audio: HTMLAudioElement | null) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onAudioElementRef = useRef(onAudioElement);
  const playAttempt = useRef(0);
  const [state, setState] = useState<AudioControlState>("idle");

  useEffect(() => {
    onAudioElementRef.current = onAudioElement;
  }, [onAudioElement]);

  const registerAudio = useCallback(
    (audio: HTMLAudioElement | null) => {
      audioRef.current = audio;
      onAudioElementRef.current?.(audio);
    },
    [],
  );

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        playAttempt.current += 1;
        audio.pause();
        audio.currentTime = 0;
        audio.removeAttribute("src");
        audio.load();
      }
      onAudioElementRef.current?.(null);
    };
  }, []);

  const resetSource = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audio.removeAttribute("src");
    audio.load();
  }, []);

  const handleClick = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !available || !audioUrl || state === "loading") return;

    if (state === "playing") {
      playAttempt.current += 1;
      audio.pause();
      setState("paused");
      onPause?.();
      return;
    }

    if (state === "error") {
      resetSource();
      setState("idle");
    }

    onPlayRequest?.(audio);
    if (!audio.getAttribute("src")) {
      audio.src = audioUrl;
      audio.load();
    }
    const attempt = ++playAttempt.current;
    setState("loading");
    try {
      await audio.play();
      if (playAttempt.current === attempt) setState("playing");
    } catch {
      if (playAttempt.current === attempt) {
        setState("error");
        onError?.();
      }
    }
  }, [
    audioUrl,
    available,
    onError,
    onPause,
    onPlayRequest,
    resetSource,
    state,
  ]);

  const unavailable = !available || !audioUrl;
  const label = unavailable
    ? labels.unavailable
    : state === "loading"
      ? labels.loading
      : state === "error"
        ? labels.retry
        : state === "playing"
          ? labels.pause
          : labels.play;
  const Icon =
    unavailable
      ? AudioLinesIcon
      : state === "loading"
        ? LoaderCircleIcon
        : state === "error"
          ? RotateCcwIcon
          : state === "playing"
            ? SquareIcon
            : AudioLinesIcon;

  return (
    <>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={unavailable || state === "loading"}
            aria-label={label}
            aria-busy={state === "loading"}
            onClick={() => void handleClick()}
            className="text-ink-soft hover:text-ink"
          >
            <Icon
              aria-hidden
              className={state === "loading" ? "animate-spin" : undefined}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <audio
        ref={registerAudio}
        preload="none"
        aria-hidden="true"
        onPlaying={() => setState("playing")}
        onPause={() => {
          playAttempt.current += 1;
          setState("paused");
        }}
        onEnded={() => {
          playAttempt.current += 1;
          const audio = audioRef.current;
          if (audio) {
            audio.currentTime = 0;
            audio.removeAttribute("src");
            audio.load();
          }
          setState("idle");
          onEnded?.();
        }}
        onError={() => {
          playAttempt.current += 1;
          setState("error");
          onError?.();
        }}
      />
    </>
  );
}
