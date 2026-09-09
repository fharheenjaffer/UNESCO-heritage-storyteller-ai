import { useState, useEffect, useRef, useCallback } from 'react';

// Extend window interface for Web Speech API SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognitionOptions {
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (errorMessage: string) => void;
  onEnd?: () => void;
}

export function useSpeechRecognition({
  lang = 'en-IN',
  onResult,
  onError,
  onEnd,
}: SpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        setIsSupported(true);
      } else {
        setIsSupported(false);
        setError(
          'Web Speech Recognition is not supported in this browser. Please use Chrome, Edge, or an Android mobile browser.'
        );
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('SpeechRecognition stop error:', err);
      }
    }
    setIsListening(false);
    setIsProcessing(false);
  }, []);

  const startListening = useCallback(
    (customLang?: string) => {
      setError(null);
      setInterimTranscript('');
      isManuallyStoppedRef.current = false;

      if (typeof window === 'undefined') return;

      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognitionClass) {
        const msg =
          'Speech recognition is not supported in this browser. Please type your query or use Google Chrome.';
        setError(msg);
        onError?.(msg);
        return;
      }

      // If already active, stop before restarting
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      try {
        const recognition = new SpeechRecognitionClass();
        recognitionRef.current = recognition;

        // Default to English (India)
        recognition.lang = customLang || lang || 'en-IN';
        recognition.continuous = false; // Highly reliable across Android Chrome and desktop
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setIsProcessing(false);
          setError(null);
        };

        recognition.onspeechstart = () => {
          setIsProcessing(false);
        };

        recognition.onspeechend = () => {
          // User finished speaking, now transcribing
          setIsProcessing(true);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let currentFinal = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const text = result[0].transcript;
            if (result.isFinal) {
              currentFinal += text;
            } else {
              currentInterim += text;
            }
          }

          if (currentFinal) {
            setTranscript((prev) => {
              const updated = prev ? `${prev} ${currentFinal.trim()}` : currentFinal.trim();
              return updated;
            });
            setInterimTranscript('');
            onResult?.(currentFinal.trim(), true);
          } else if (currentInterim) {
            setInterimTranscript(currentInterim);
            onResult?.(currentInterim, false);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error event:', event.error);
          let errorMsg = 'Speech recognition error occurred.';

          switch (event.error) {
            case 'not-allowed':
            case 'permission-denied':
              errorMsg =
                'Microphone access was denied. Please allow microphone permission in your browser settings to speak.';
              break;
            case 'no-speech':
              errorMsg =
                'No speech was detected. Tap the microphone and speak clearly.';
              break;
            case 'audio-capture':
              errorMsg =
                'No microphone was detected or audio capture failed. Please check your microphone.';
              break;
            case 'network':
              errorMsg =
                'Network connection error during voice recognition. Please verify your connection.';
              break;
            case 'aborted':
              // User or app cancelled
              return;
            default:
              errorMsg = `Voice recognition error: ${event.error}`;
          }

          setError(errorMsg);
          onError?.(errorMsg);
          setIsListening(false);
          setIsProcessing(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          setIsProcessing(false);
          onEnd?.();
        };

        recognition.start();
      } catch (err: any) {
        console.error('Failed to start SpeechRecognition:', err);
        const msg =
          err?.message ||
          'Could not start microphone voice input. Please ensure permissions are granted.';
        setError(msg);
        onError?.(msg);
        setIsListening(false);
        setIsProcessing(false);
      }
    },
    [lang, onError, onEnd, onResult]
  );

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    isProcessing,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
