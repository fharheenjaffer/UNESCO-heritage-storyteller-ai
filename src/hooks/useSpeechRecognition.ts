import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseSpeechRecognitionProps {
  onResult?: (text: string) => void;
  lang?: string;
}

export function useSpeechRecognition({
  onResult,
  lang = 'en-IN',
}: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        setIsSupported(true);
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = lang;

          recognition.onstart = () => {
            setIsListening(true);
            setErrorMessage(null);
          };

          recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              } else {
                interimTranscript += transcript;
              }
            }

            const currentText = finalTranscript || interimTranscript;
            if (currentText && onResultRef.current) {
              onResultRef.current(currentText);
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('Speech recognition event:', event.error);
            if (event.error === 'not-allowed') {
              setErrorMessage('Microphone access denied. Please allow microphone permissions.');
            } else if (event.error === 'no-speech') {
              // No speech detected, harmless
            } else {
              setErrorMessage(`Speech recognition notice: ${event.error}`);
            }
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
        } catch (e: any) {
          console.warn('Speech recognition init warning:', e);
          setIsSupported(false);
        }
      } else {
        setIsSupported(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [lang]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setErrorMessage('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    if (recognitionRef.current) {
      try {
        setErrorMessage(null);
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
      } catch (err: any) {
        // If already started, stop then restart
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    }
  }, [isSupported, lang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
    clearError: () => setErrorMessage(null),
  };
}
