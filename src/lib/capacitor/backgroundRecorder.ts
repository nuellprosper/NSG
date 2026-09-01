import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './platform';

export interface BackgroundRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  durationSeconds: number;
  startTime: number | null;
  channelId: string;
}

export interface RecordingResult {
  blob?: Blob;
  base64?: string;
  durationSeconds: number;
  mimeType: string;
}

const RECORDING_NOTIFICATION_ID = 88001;
const RECORDING_CHANNEL_ID = 'nsg_recording_service';

let activeMediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];
let durationInterval: any = null;
let recordingDuration = 0;
let isCurrentlyRecording = false;
let isCurrentlyPaused = false;
let onStateChangeCallback: ((state: BackgroundRecordingState) => void) | null = null;
let onFinishCallback: ((result: RecordingResult) => void) | null = null;

/**
 * Initialize Foreground Service Media Notification Channels and Action Types
 */
export async function initRecordingNotificationChannel(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    // 1. Register Action Types for Media Notification ("Pause", "Continue", "End")
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'RECORDING_ACTIONS',
          actions: [
            {
              id: 'pause_recording',
              title: '⏸️ Pause',
              foreground: false
            },
            {
              id: 'resume_recording',
              title: '▶️ Continue',
              foreground: false
            },
            {
              id: 'end_recording',
              title: '⏹️ End & Save',
              foreground: true
            }
          ]
        }
      ]
    });

    // 2. Create ongoing low-intrusive foreground recording channel
    await LocalNotifications.createChannel({
      id: RECORDING_CHANNEL_ID,
      name: 'Class Audio Foreground Recorder',
      description: 'Persistent notification maintaining audio recording while the screen is locked or app is in background',
      importance: 3, // Ongoing status bar
      visibility: 1,
      sound: undefined,
      vibration: false,
      lights: false
    });
  } catch (err) {
    console.warn('Foreground recording channel setup notice:', err);
  }
}

/**
 * Post or update persistent media notification in Android status bar
 */
async function updateRecordingNotification(isPaused: boolean, currentDuration: number): Promise<void> {
  if (!isNativePlatform()) return;

  const mins = Math.floor(currentDuration / 60);
  const secs = currentDuration % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: RECORDING_NOTIFICATION_ID,
          title: isPaused ? '⏸️ Class Recording Paused' : '🔴 Class Recording in Progress',
          body: isPaused 
            ? `Duration: ${timeFormatted} • Tap Continue to resume class capture`
            : `Duration: ${timeFormatted} • Audio captured continuously in background`,
          channelId: RECORDING_CHANNEL_ID,
          ongoing: true, // Prevents swipe dismiss on native Android
          autoCancel: false,
          actionTypeId: 'RECORDING_ACTIONS',
          extra: { type: 'foreground_recorder', isPaused }
        }
      ]
    });
  } catch (e) {
    console.warn('Persistent recording notification update notice:', e);
  }
}

/**
 * Dismiss persistent media notification
 */
async function clearRecordingNotification(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: RECORDING_NOTIFICATION_ID }]
    });
  } catch (e) {
    console.warn('Clear recording notification notice:', e);
  }
}

/**
 * Start Background Audio Recording with Android Foreground Media Service
 */
export async function startBackgroundRecording(
  onStateChange?: (state: BackgroundRecordingState) => void,
  onFinish?: (result: RecordingResult) => void
): Promise<boolean> {
  onStateChangeCallback = onStateChange || null;
  onFinishCallback = onFinish || null;
  recordingDuration = 0;
  isCurrentlyRecording = true;
  isCurrentlyPaused = false;

  await initRecordingNotificationChannel();

  const isNative = isNativePlatform();

  if (isNative) {
    try {
      const { VoiceRecorder } = await import('capacitor-voice-recorder');
      const hasPerm = await VoiceRecorder.hasAudioRecordingPermission();
      if (!hasPerm.value) {
        const req = await VoiceRecorder.requestAudioRecordingPermission();
        if (!req.value) {
          isCurrentlyRecording = false;
          return false;
        }
      }

      await VoiceRecorder.startRecording();

      // Launch persistent notification
      await updateRecordingNotification(false, 0);

      // Duration ticker
      if (durationInterval) clearInterval(durationInterval);
      durationInterval = setInterval(() => {
        if (!isCurrentlyPaused) {
          recordingDuration += 1;
          if (recordingDuration % 5 === 0) {
            updateRecordingNotification(isCurrentlyPaused, recordingDuration);
          }
          if (onStateChangeCallback) {
            onStateChangeCallback({
              isRecording: true,
              isPaused: isCurrentlyPaused,
              durationSeconds: recordingDuration,
              startTime: Date.now() - (recordingDuration * 1000),
              channelId: RECORDING_CHANNEL_ID
            });
          }
        }
      }, 1000);

      return true;
    } catch (pluginErr) {
      console.warn('VoiceRecorder native start failed, falling back to WebRTC:', pluginErr);
    }
  }

  // WebRTC / Browser fallback with MediaRecorder
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      isCurrentlyRecording = false;
      return false;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    recordedChunks = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : 'audio/webm';

    activeMediaRecorder = new MediaRecorder(stream, { mimeType });
    activeMediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    activeMediaRecorder.start(1000);

    if (durationInterval) clearInterval(durationInterval);
    durationInterval = setInterval(() => {
      if (!isCurrentlyPaused) {
        recordingDuration += 1;
        if (onStateChangeCallback) {
          onStateChangeCallback({
            isRecording: true,
            isPaused: isCurrentlyPaused,
            durationSeconds: recordingDuration,
            startTime: Date.now() - (recordingDuration * 1000),
            channelId: RECORDING_CHANNEL_ID
          });
        }
      }
    }, 1000);

    return true;
  } catch (webErr) {
    console.error('Failed to start Web Audio MediaRecorder:', webErr);
    isCurrentlyRecording = false;
    return false;
  }
}

/**
 * Pause background recording
 */
export async function pauseBackgroundRecording(): Promise<void> {
  if (!isCurrentlyRecording || isCurrentlyPaused) return;

  isCurrentlyPaused = true;

  if (isNativePlatform()) {
    try {
      const { VoiceRecorder } = await import('capacitor-voice-recorder');
      await VoiceRecorder.pauseRecording();
    } catch (e) {}
  } else if (activeMediaRecorder && activeMediaRecorder.state === 'recording') {
    activeMediaRecorder.pause();
  }

  await updateRecordingNotification(true, recordingDuration);

  if (onStateChangeCallback) {
    onStateChangeCallback({
      isRecording: true,
      isPaused: true,
      durationSeconds: recordingDuration,
      startTime: Date.now() - (recordingDuration * 1000),
      channelId: RECORDING_CHANNEL_ID
    });
  }
}

/**
 * Resume background recording
 */
export async function resumeBackgroundRecording(): Promise<void> {
  if (!isCurrentlyRecording || !isCurrentlyPaused) return;

  isCurrentlyPaused = false;

  if (isNativePlatform()) {
    try {
      const { VoiceRecorder } = await import('capacitor-voice-recorder');
      await VoiceRecorder.resumeRecording();
    } catch (e) {}
  } else if (activeMediaRecorder && activeMediaRecorder.state === 'paused') {
    activeMediaRecorder.resume();
  }

  await updateRecordingNotification(false, recordingDuration);

  if (onStateChangeCallback) {
    onStateChangeCallback({
      isRecording: true,
      isPaused: false,
      durationSeconds: recordingDuration,
      startTime: Date.now() - (recordingDuration * 1000),
      channelId: RECORDING_CHANNEL_ID
    });
  }
}

/**
 * End and save background recording
 */
export async function stopBackgroundRecording(): Promise<RecordingResult | null> {
  if (!isCurrentlyRecording) return null;

  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }

  isCurrentlyRecording = false;
  isCurrentlyPaused = false;
  await clearRecordingNotification();

  const finalDuration = recordingDuration;

  if (isNativePlatform()) {
    try {
      const { VoiceRecorder } = await import('capacitor-voice-recorder');
      const result = await VoiceRecorder.stopRecording();
      
      const recordData: RecordingResult = {
        base64: result.value.recordDataBase64,
        durationSeconds: finalDuration || Math.round(result.value.msDuration / 1000),
        mimeType: result.value.mimeType || 'audio/aac'
      };

      if (onFinishCallback) {
        onFinishCallback(recordData);
      }
      return recordData;
    } catch (e) {
      console.warn('VoiceRecorder stop error:', e);
    }
  }

  // Web fallback stop
  if (activeMediaRecorder) {
    return new Promise((resolve) => {
      activeMediaRecorder!.onstop = () => {
        const mimeType = activeMediaRecorder!.mimeType || 'audio/webm';
        const blob = new Blob(recordedChunks, { type: mimeType });
        
        // Stop stream tracks
        if (activeMediaRecorder?.stream) {
          activeMediaRecorder.stream.getTracks().forEach(t => t.stop());
        }
        activeMediaRecorder = null;
        recordedChunks = [];

        const res: RecordingResult = {
          blob,
          durationSeconds: finalDuration,
          mimeType
        };

        if (onFinishCallback) onFinishCallback(res);
        resolve(res);
      };

      try {
        activeMediaRecorder.stop();
      } catch (e) {
        resolve({ durationSeconds: finalDuration, mimeType: 'audio/webm' });
      }
    });
  }

  return { durationSeconds: finalDuration, mimeType: 'audio/webm' };
}

/**
 * Check active recording state
 */
export function getBackgroundRecordingState(): BackgroundRecordingState {
  return {
    isRecording: isCurrentlyRecording,
    isPaused: isCurrentlyPaused,
    durationSeconds: recordingDuration,
    startTime: isCurrentlyRecording ? Date.now() - (recordingDuration * 1000) : null,
    channelId: RECORDING_CHANNEL_ID
  };
}
