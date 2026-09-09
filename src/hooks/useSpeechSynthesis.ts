import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speakingText, setSpeakingText] = useState<string>('');

  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceIndexRef = useRef<number>(0);
  const isCancelledRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);

      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);

        // Requirement 2: Prioritize English (India) voice
        const indianVoice = voices.find(
          (v) => v.lang === 'en-IN' || v.lang === 'en_IN' || v.name.toLowerCase().includes('india')
        );

        const naturalEnVoice = voices.find(
          (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural'))
        );

        const anyEnglishVoice =
          voices.find((v) => v.lang === 'en-GB') ||
          voices.find((v) => v.lang === 'en-US') ||
          voices.find((v) => v.lang.startsWith('en'));

        const bestVoice = indianVoice || naturalEnVoice || anyEnglishVoice || voices[0] || null;
        setVoice((prev) => prev || bestVoice);
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  /**
   * Cleans markdown and converts structured headers into smooth conversational audio guide phrasing
   */
  const cleanTextForSpeech = (text: string) => {
    return text
      // Friendly audio tour guide header transitions
      .replace(/##\s*Monument Overview/gi, 'Monument overview.')
      .replace(/##\s*Historical Background/gi, 'Historical background.')
      .replace(/##\s*Architectural Highlights/gi, 'Architectural highlights.')
      .replace(/##\s*Interesting Facts/gi, 'Here are some interesting facts.')
      .replace(/##\s*Storytelling Experience/gi, 'Storytelling experience.')
      .replace(/##\s*Guided Tour:\s*/gi, 'Guided Tour: ')
      // Strip markdown marks
      .replace(/###+/g, '')
      .replace(/##/g, '')
      .replace(/#/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Turn bullet items into smooth sentences
      .replace(/^\s*[-*•]\s+/gm, ' ')
      .replace(/\n\s*[-*•]\s+/g, '. ')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      // Clean up multiple periods or spaces
      .replace(/\.{2,}/g, '.')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  /**
   * Split long texts into manageable sentence chunks for smooth playback without browser truncation
   */
  const splitIntoChunks = (text: string, maxChunkLength = 180): string[] => {
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      if ((currentChunk + ' ' + trimmed).trim().length <= maxChunkLength) {
        currentChunk = (currentChunk + ' ' + trimmed).trim();
      } else {
        if (currentChunk) chunks.push(currentChunk);
        if (trimmed.length > maxChunkLength) {
          // If single sentence is very long, split by comma or spaces
          const parts = trimmed.split(/,\s+/);
          let subChunk = '';
          for (const part of parts) {
            if ((subChunk + ', ' + part).trim().length <= maxChunkLength) {
              subChunk = (subChunk + ', ' + part).trim();
            } else {
              if (subChunk) chunks.push(subChunk);
              subChunk = part;
            }
          }
          if (subChunk) chunks.push(subChunk);
          currentChunk = '';
        } else {
          currentChunk = trimmed;
        }
      }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks.length > 0 ? chunks : [text];
  };

  const stop = useCallback(() => {
    isCancelledRef.current = true;
    utterancesRef.current = [];
    currentUtteranceIndexRef.current = 0;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setSpeakingText('');
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!supported || typeof window === 'undefined') return;

      // Stop any active speech first
      stop();

      const cleaned = cleanTextForSpeech(text);
      if (!cleaned) return;

      isCancelledRef.current = false;
      setSpeakingText(cleaned);

      const chunks = splitIntoChunks(cleaned);
      utterancesRef.current = [];
      currentUtteranceIndexRef.current = 0;

      // Select active voice
      const currentVoice = voice || (availableVoices.find((v) => v.lang === 'en-IN') ?? null);

      chunks.forEach((chunk, index) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        if (currentVoice) {
          utterance.voice = currentVoice;
        }
        utterance.lang = currentVoice ? currentVoice.lang : 'en-IN';
        utterance.rate = 0.98; // Engaging, friendly audio guide pace
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          if (index === 0) {
            setIsSpeaking(true);
            setIsPaused(false);
          }
        };

        utterance.onend = () => {
          if (isCancelledRef.current) return;

          currentUtteranceIndexRef.current = index + 1;
          if (index === chunks.length - 1) {
            setIsSpeaking(false);
            setIsPaused(false);
            setSpeakingText('');
          }
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesisUtterance error:', e);
          if (isCancelledRef.current) return;
          setIsSpeaking(false);
          setIsPaused(false);
          setSpeakingText('');
        };

        utterancesRef.current.push(utterance);
      });

      // Start speaking the first chunk, queue subsequent chunks
      if (utterancesRef.current.length > 0) {
        setIsSpeaking(true);
        utterancesRef.current.forEach((utt) => {
          window.speechSynthesis.speak(utt);
        });
      }
    },
    [supported, voice, availableVoices, stop]
  );

  const pause = useCallback(() => {
    if (!supported || typeof window === 'undefined') return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported || typeof window === 'undefined') return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [supported]);

  return {
    isSpeaking,
    isPaused,
    supported,
    voice,
    availableVoices,
    speakingText,
    setVoice,
    speak,
    pause,
    resume,
    stop,
  };
}
