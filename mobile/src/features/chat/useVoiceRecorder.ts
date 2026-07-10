import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

export const MAX_VOICE_MESSAGE_SECONDS = 120;

/** Sesli mesajlar için düşük bitrate yeterli; sunucudaki 5MB sınırını rahatça karşılar. */
export function useVoiceRecorder() {
  const Recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const State = useAudioRecorderState(Recorder, 200);

  async function start(): Promise<boolean> {
    const Permission = await requestRecordingPermissionsAsync();

    if (!Permission.granted) {
      return false;
    }

    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await Recorder.prepareToRecordAsync();
    Recorder.record();

    return true;
  }

  async function stop(): Promise<{ uri: string; durationSeconds: number } | null> {
    const DurationMs = State.durationMillis;
    await Recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });

    if (Recorder.uri == null) {
      return null;
    }

    return { uri: Recorder.uri, durationSeconds: Math.max(1, Math.round(DurationMs / 1000)) };
  }

  return {
    start,
    stop,
    isRecording: State.isRecording,
    durationSeconds: Math.floor(State.durationMillis / 1000),
  };
}
