import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  WledClient,
  getMainSegment,
  getWledEndpoint,
  setWledEndpoint,
  resetWledEndpoint,
  type WledFullData,
  type WledSegmentUpdate,
  type WledUpdate,
} from "@/lib/wled";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";
import { toast } from "sonner";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useWled({ includePresets = false } = {}) {
  const [endpoint, setEndpoint] = useState(getWledEndpoint);
  const queryClient = useQueryClient();
  const queryKey = ["wled", endpoint];
  const client = new WledClient(endpoint);
  const device = useQuery({
    queryKey,
    queryFn: ({ signal }) => client.getFull(signal),
    retry: false,
    refetchInterval: 5000,
  });
  const presets = useQuery({
    queryKey: ["wled-presets", endpoint],
    queryFn: ({ signal }) => client.getPresets(signal),
    enabled: includePresets && device.isSuccess,
    retry: false,
  });
  const mutation = useMutation({
    scope: { id: `wled:${endpoint}` },
    mutationFn: (update: WledUpdate) => client.updateState(update),
    onSuccess: async (confirmedState) => {
      await queryClient.cancelQueries({ queryKey, exact: true });
      queryClient.setQueryData<WledFullData>(queryKey, (previous) =>
        previous ? { ...previous, state: confirmedState } : previous,
      );
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey, exact: true });
    },
  });

  const state = device.data?.state;
  const info = device.data?.info;
  const effects = device.data?.effects ?? [];
  const palettes = device.data?.palettes ?? [];
  const segment = getMainSegment(state);
  const currentEffectId = segment?.fx ?? 0;
  const currentPaletteId = segment?.pal ?? 0;
  const connected = device.isSuccess;
  const primaryColor = segment?.col?.[0] ?? [255, 160, 0];

  const refresh = () => {
    void device.refetch();
    if (includePresets && connected) void presets.refetch();
  };

  const updateEndpoint = (value: string) => {
    try {
      const next = setWledEndpoint(value);
      setEndpoint(next);
      if (next === endpoint) refresh();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  const resetEndpoint = () => {
    const next = resetWledEndpoint();
    setEndpoint(next);
    if (next === endpoint) refresh();
    return next;
  };

  const send = async (update: WledUpdate, failureMessage: string) => {
    if (!connected) return false;
    try {
      await mutation.mutateAsync(update);
      return true;
    } catch (error) {
      toast.error(failureMessage, { description: getErrorMessage(error) });
      return false;
    }
  };

  const updateSegment = (
    update: Omit<WledSegmentUpdate, "id">,
    failureMessage: string,
  ) => {
    if (!segment) return Promise.resolve(false);
    return send({ seg: [{ ...update, id: segment.id }] }, failureMessage);
  };

  const togglePower = async () => {
    if (!state || mutation.isPending) return;
    haptic.medium();
    sounds.click();
    const on = !state.on;
    const applied = await send({ on }, "Failed to change LED power");
    if (applied) {
      if (on) sounds.toggleOn();
      else sounds.toggleOff();
    } else {
      haptic.error();
    }
  };

  const setScene = async (scene: {
    color: [number, number, number];
    effect: string;
    speed: number;
    intensity: number;
    brightness: number;
  }) => {
    if (!segment) return false;
    const effect = effects.findIndex((name) => name.toLowerCase() === scene.effect.toLowerCase());
    return send({
      on: true,
      bri: scene.brightness,
      seg: [{
        id: segment.id,
        on: true,
        col: [scene.color],
        fx: Math.max(0, effect),
        sx: scene.speed,
        ix: scene.intensity,
        pal: 0,
      }],
    }, "Failed to apply lighting scene");
  };

  return {
    endpoint,
    state,
    info,
    segment,
    effects,
    palettes,
    presets: presets.data,
    presetsError: presets.isError,
    connected,
    loading: device.isFetching,
    busy: mutation.isPending,
    error: device.error?.message,
    lastSeen: device.dataUpdatedAt ? new Date(device.dataUpdatedAt) : null,
    primaryColor,
    currentEffectId,
    currentEffectName: effects[currentEffectId] || `Effect ${currentEffectId}`,
    currentPaletteId,
    currentPaletteName: palettes[currentPaletteId] || `Palette ${currentPaletteId}`,
    togglePower,
    setBrightness: (bri: number) => send({ bri }, "Failed to set brightness"),
    setColor: (r: number, g: number, b: number) =>
      updateSegment({ col: [[r, g, b]] }, "Failed to set LED color"),
    setEffect: (fx: number) => updateSegment({ fx }, "Failed to set effect"),
    setSpeed: (sx: number) => updateSegment({ sx }, "Failed to set animation speed"),
    setIntensity: (ix: number) => updateSegment({ ix }, "Failed to set effect intensity"),
    setPalette: (pal: number) => updateSegment({ pal }, "Failed to set palette"),
    setPreset: (ps: number) => send({ ps }, "Failed to apply preset"),
    setNightlight: () =>
      send({ nl: { on: true, dur: 30, mode: 1, tbri: 0 } }, "Failed to start nightlight"),
    setScene,
    updateEndpoint,
    resetEndpoint,
    refresh,
  };
}

export function useWledSlider(value: number, commit: (value: number) => Promise<boolean>) {
  const [draft, setDraft] = useState<number | null>(null);
  const revision = useRef(0);

  return {
    value: draft ?? value,
    onValueChange: ([next]: number[]) => {
      revision.current++;
      setDraft(next);
    },
    onValueCommit: async ([next]: number[]) => {
      // Radix calls the commit callback before onValueChange for keyboard input.
      await Promise.resolve();
      const id = revision.current;
      await commit(next);
      if (revision.current === id) setDraft(null);
    },
    onPointerCancel: () => {
      revision.current++;
      setDraft(null);
    },
  };
}
