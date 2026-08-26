/**
 * Background Audio Recording Manager with Persistent Media Notification & Action Buttons
 * Supports screen-lock continuation via WakeLock, Capacitor VoiceRecorder, and Foreground Notifications
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './platform';
import { requestMicrophonePermission } from './permissions';

export interface BackgroundRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  lectureTitle: string;
  courseCode: string;
}

const NOTIFICATION_ID_RECORDING = 88888;
const CHANNEL_ID_RECORDING = 'nsg_audio_recording';

let activeWakeLock: any = null;
let recordingTimer: NodeJS.Timeout | null = null;
let currentRecordingState: BackgroundRecordingState = {
  isRecording: false,
  isPaused: false,
  startTime: null,
  elapsedSeconds: 0,
  lectureTitle: 'Live Lecture Session',
  courseCode: 'NSG Audio'
};

const recordingListeners = new Set<(state: BackgroundRecordingState) => void>();

function notifyStateChange() {
  const stateCopy = { ...currentRecordingState };
  recordingListeners.forEach(fn => {
    try { fn(stateCopy); } catch (e) {}
  });
}

/**
 * Register the Notification Action Types for Background Media Recording
 * Provides: "Pause", "Continue", and "End" buttons.
 */
export async function registerRecordingActionTypes(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    // 1. Create High-Priority Ongoing Notification Channel
    await LocalNotifications.createChannel({
      id: CHANNEL_ID_RECORDING,
      name: 'Lecture Audio Recording Service',
      description: 'Persistent media controller for background lecture audio recording',
      importance: 4, // High importance
      visibility: 1, // Public on lockscreen
      sound: undefined,
      vibration: false,
      lights: true,
      lightColor: '#DC2626'
    }).catch(() => {});

    // 2. Register Interactive Action Buttons
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'RECORDING_ACTION',
          actions: [
            {
              id: 'pause_recording',
              title: '⏸️ Pause',
              foreground: false // Execute silently in background
            },
            {
              id: 'resume_recording',
              title: '▶️ Continue',
              foreground: false // Execute silently in background
            },
            {
              id: 'end_recording',
              title: '⏹️ End',
              foreground: true // Brings app to front to save/transcribe
            }
          ]
        }
      ]
    }).catch((err) => {
      console.warn('Recording action types registration warning:', err);
    });
  } catch (e) {
    console.warn('Error setting up recording notification channel:', e);
  }
}

/**
 * Update the persistent lockscreen/status bar notification with current elapsed recording time
 */
export async function updateRecordingNotification(): Promise<void> {
  if (!isNativePlatform() || !currentRecordingState.isRecording) return;

  const mins = Math.floor(currentRecordingState.elapsedSeconds / 60);
  const secs = currentRecordingState.elapsedSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const statusText = currentRecordingState.isPaused ? '⏸️ Recording Paused' : '🔴 Recording in background...';
  const title = `🎙️ ${currentRecordingState.courseCode}: ${currentRecordingState.lectureTitle}`;
  const body = `${statusText} (${timeFormatted}) • Tap controls below to manage session.`;

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID_RECORDING,
          title,
          body,
          channelId: CHANNEL_ID_RECORDING,
          actionTypeId: 'RECORDING_ACTION',
          ongoing: true, // Cannot be swiped away while recording
          autoCancel: false,
          schedule: { at: new Date(Date.now() + 100), allowWhileIdle: true },
          extra: {
            type: 'recording_controller',
            isPaused: currentRecordingState.isPaused,
            elapsedSeconds: currentRecordingState.elapsedSeconds
          }
        }
      ]
    });
  } catch (err) {
    console.warn('Could not update background recording notification:', err);
  }
}

/**
 * Request Screen & CPU WakeLock so recording never stops when the screen is locked
 */
async function acquireWakeLock(): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      activeWakeLock = await (navigator as any).wakeLock.request('screen');
      activeWakeLock.addEventListener('release', () => {
        activeWakeLock = null;
      });
    }
  } catch (e) {
    console.warn('WakeLock request notice:', e);
  }
}

function releaseWakeLock(): void {
  try {
    if (activeWakeLock) {
      activeWakeLock.release();
      activeWakeLock = null;
    }
  } catch (e) {}
}

/**
 * Start Background Audio Recording Session
 */
export async function startBackgroundLectureRecording(options?: {
  courseCode?: string;
  lectureTitle?: string;
}): Promise<boolean> {
  const perm = await requestMicrophonePermission();
  if (!perm) return false;

  await registerRecordingActionTypes();
  await acquireWakeLock();

  if (isNativePlatform()) {
    try {
      const { VoiceRecorder } = await import('capacitor-voice-recorder');
      await VoiceRecorder.startRecording();
    } catch (err) {
      console.warn('Native VoiceRecorder start error, continuing with fallback:', err);
    }
  }

  currentRecordingState = {
    isRecording: true,
    isPaused: false,
    startTime: Date.now(),
    elapsedSeconds: 0,
    lectureTitle: options?.lectureTitle || 'Lecture Session',
    courseCode: options?.courseCode || 'NSG'
  };

  // Start ticker timer
  if (recordingTimer) clearInterval(recordingTimer);
  recordingTimer = setInterval(() => {
    if (currentRecordingState.isRecording && !currentRecordingState.isPaused) {
      currentRecordingState.elapsedSeconds += 1;
      notifyStateChange();

      // Update notification every 5 seconds or when state toggles
      if (currentRecordingState.elapsedSeconds % 5 === 0) {
        updateRecordingNotification();
      }
    }
  }, 1000);

  await updateRecordingNotification();
  notifyStateChange();
  return true;
}

/**
 * Pause Recording (Silently from Notification Button or App UI)
 */
export async function pauseBackgroundLectureRecording(): Promise<void> {
  if (!currentRecordingState.isRecording || currentRecordingState.isPaused) return;

  if (isNativePlatform()) {
    try {
      const { VoiceRecorder } = await import('capacitor-voice-recorder');
      await VoiceRecorder.pauseRecording();
    } catch (e) {}
  }

  currentRecordingState.isPaused = true;
  await updateRecordingNotification();
  notifyStateChange();
}

/**
 * Resume / Continue Recording
 */
export async function resumeBackgroundLectureRecording(): Promise<void> {
  if (!currentRecordingState.isRecording || !currentRecordingState.isPaused) return;

  if (isNativePlatform()) {
    try {
      const { VoiceRecorder } = await import('capacitor-voice-recorder');
      await VoiceRecorder.resumeRecording();
    } catch (e) {}
  }

  currentRecordingState.isPaused = false;
  await updateRecordingNotification();
  notifyStateChange();
}

/**
 * End / Stop Recording and Remove Ongoing Notification
 */
export async function stopBackgroundLectureRecording(): Promise<{
  base64?: string;
  duration?: number;
  mimeType?: string;
} | null> {
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }

  releaseWakeLock();

  let recordedData: any = null;
  if (isNativePlatform()) {
    try {
      const { VoiceRecorder } = await import('capacitor-voice-recorder');
      const res = await VoiceRecorder.stopRecording();
      if (res?.value?.recordDataBase64) {
        recordedData = {
          base64: res.value.recordDataBase64,
          duration: res.value.msDuration ? Math.round(res.value.msDuration / 1000) : currentRecordingState.elapsedSeconds,
          mimeType: res.value.mimeType || 'audio/aac'
        };
      }
    } catch (e) {
      console.warn('VoiceRecorder stop error:', e);
    }

    // Cancel persistent notification
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: NOTIFICATION_ID_RECORDING }]
      });
    } catch (e) {}
  }

  currentRecordingState = {
    isRecording: false,
    isPaused: false,
    startTime: null,
    elapsedSeconds: 0,
    lectureTitle: 'Live Lecture Session',
    courseCode: 'NSG Audio'
  };

  notifyStateChange();
  return recordedData;
}

export function getBackgroundRecordingState(): BackgroundRecordingState {
  return { ...currentRecordingState };
}

export function subscribeRecordingState(fn: (state: BackgroundRecordingState) => void): () => void {
  recordingListeners.add(fn);
  fn({ ...currentRecordingState });
  return () => {
    recordingListeners.delete(fn);
  };
}
