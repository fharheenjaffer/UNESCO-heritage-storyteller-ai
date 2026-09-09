/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { MonumentCarousel } from './components/MonumentCarousel';
import { ChatMessageView } from './components/ChatMessageView';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { BookmarksModal } from './components/BookmarksModal';
import { AudioNarrationBar } from './components/AudioNarrationBar';
import { DEFAULT_MONUMENT_KNOWLEDGE } from './data/defaultKnowledge';
import { MonumentKnowledgeDoc, ChatMessage, StoryMode, BookmarkItem } from './types';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { VoiceStatusBar } from './components/VoiceStatusBar';
import {
  getStoredBookmarks,
  saveBookmarkToStorage,
  removeBookmarkFromStorage,
  clearAllBookmarksFromStorage,
  isMessageBookmarked,
} from './utils/bookmarkStorage';
import {
  Send,
  Sparkles,
  Loader2,
  Landmark,
  Compass,
  BookOpen,
  AlertCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content: `## Monument Overview
**Heritage Storyteller AI Collection**  
**Location:** India

## Historical Background
India's architectural heritage spans millennia—from rock-cut cave sanctuaries of the 2nd century BCE to classical granite temples of the Chola empire and intricate marble domes of the Mughal era.

## Architectural Highlights
- Complete grounding in verified monument knowledge files
- Structured five-part educational storytelling
- 5 specialized guide modes (Tell me a story, Act as a tourist guide, Explain for a child, Give me facts, Compare monuments)

## Interesting Facts
- Grounded strictly in the uploaded collection of 28 Indian historical monuments and UNESCO World Heritage Sites.
- You can upload custom monument knowledge documents at any time using the **Knowledge Base** button in the header.
- If you ask about any monument not in the collection, I strictly report: *"I could not find this information in my monument knowledge collection."*

## Storytelling Experience
Close your eyes and listen as we walk through ancient stone corridors, grand arches, and sacred spires carved with the sweat and devotion of master builders.

Would you like to explore another monument?`,
  timestamp: Date.now(),
  mode: 'standard',
};

export default function App() {
  const [monuments, setMonuments] = useState<MonumentKnowledgeDoc[]>(DEFAULT_MONUMENT_KNOWLEDGE);
  const [selectedMonument, setSelectedMonument] = useState<MonumentKnowledgeDoc>(DEFAULT_MONUMENT_KNOWLEDGE[0]);
  const [mode, setMode] = useState<StoryMode>('standard');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => getStoredBookmarks());
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isSpeaking, isPaused, speak, pause, resume, stop } = useSpeechSynthesis();

  // Requirement 3: Auto-Speak Mode (persisted in local storage)
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('heritage_auto_speak');
      return stored === 'true';
    }
    return false;
  });

  const handleToggleAutoSpeak = () => {
    setAutoSpeak((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('heritage_auto_speak', String(next));
      }
      return next;
    });
  };

  const handleSpeakMessage = (msgId: string, content: string) => {
    setSpeakingMessageId(msgId);
    speak(content);
  };

  const handleStopSpeaking = () => {
    setSpeakingMessageId(null);
    stop();
  };

  // Reset active speaking message ID when speech concludes
  useEffect(() => {
    if (!isSpeaking) {
      setSpeakingMessageId(null);
    }
  }, [isSpeaking]);

  // Requirement 1: Voice Input (Speech-to-Text) with Web Speech API
  const {
    isListening,
    isProcessing: isSpeechProcessing,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang: 'en-IN',
    onResult: (spokenText) => {
      // Place recognized text into the chat input box automatically
      setInput(spokenText);
    },
    onError: (err) => {
      console.warn('Speech recognition notice:', err);
    },
  });

  const handleToggleVoiceInput = () => {
    // Stop any active narration so mic doesn't catch the audio
    if (isSpeaking) {
      handleStopSpeaking();
    }

    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening('en-IN');
    }
  };

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Fetch monuments list from backend
  const fetchMonuments = async () => {
    try {
      const res = await fetch('/api/monuments');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMonuments(data);
          if (!selectedMonument || !data.some((m: MonumentKnowledgeDoc) => m.id === selectedMonument.id)) {
            setSelectedMonument(data[0]);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch monuments from server, using local defaults:', err);
    }
  };

  useEffect(() => {
    fetchMonuments();
  }, []);

  const handleSendMessage = async (textToSend?: string, overrideMode?: StoryMode) => {
    // If voice input is currently listening, stop it
    if (isListening) {
      stopListening();
    }

    const text = (textToSend !== undefined ? textToSend : input).trim();
    if (!text || isLoading) return;

    const currentActiveMode = overrideMode || mode;

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      mode: currentActiveMode,
      monumentName: selectedMonument?.name,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/storyteller/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          mode: currentActiveMode,
          monumentId: selectedMonument?.id,
          customKnowledgeDocs: monuments.filter((m) => m.isCustom),
        }),
      });

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: 'msg-assistant-' + Date.now(),
        role: 'assistant',
        content: data.reply || 'I could not find this information in my monument knowledge collection.',
        timestamp: Date.now(),
        mode: currentActiveMode,
        isNotFound: data.isNotFound,
        monumentName: data.monumentName || selectedMonument?.name,
        monumentLocation: data.monumentLocation || selectedMonument?.location,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Requirement 3: Auto-Speak Mode: When enabled, every bot response should be spoken automatically
      if (autoSpeak) {
        handleSpeakMessage(assistantMessage.id, assistantMessage.content);
      }
    } catch (err: any) {
      console.error('Error in chat request:', err);
      const errorMessage: ChatMessage = {
        id: 'msg-error-' + Date.now(),
        role: 'assistant',
        content: `I encountered an unexpected issue consulting the monument archives. Please try again.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (promptText: string, actionMode: StoryMode) => {
    setMode(actionMode);
    handleSendMessage(promptText, actionMode);
  };

  const handleTestUnknownMonument = () => {
    // Testing unindexed monument (Rule 5 compliance check)
    handleSendMessage('Tell me about the Eiffel Tower and its historical architecture.');
  };

  const handleSelectMonument = (monument: MonumentKnowledgeDoc) => {
    setSelectedMonument(monument);
    // Suggest exploration in chat or user input
    inputRef.current?.focus();
  };

  const handleUploadDocument = async (newDoc: Partial<MonumentKnowledgeDoc>): Promise<boolean> => {
    try {
      const res = await fetch('/api/knowledge/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchMonuments();
        if (data.document) {
          setSelectedMonument(data.document);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Upload failed:', err);
      return false;
    }
  };

  const handleDeleteDocument = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchMonuments();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Delete failed:', err);
      return false;
    }
  };

  const handleResetDefault = async () => {
    try {
      await fetch('/api/knowledge/reset', { method: 'POST' });
      await fetchMonuments();
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  const handleResetChat = () => {
    handleStopSpeaking();
    setMessages([INITIAL_WELCOME_MESSAGE]);
  };

  const handleToggleBookmark = (msg: ChatMessage) => {
    const isCurrentlyBookmarked = isMessageBookmarked(bookmarks, msg.id, msg.content);
    if (isCurrentlyBookmarked) {
      const existing = bookmarks.find(
        (b) => (b.messageId && b.messageId === msg.id) || b.content.trim() === msg.content.trim()
      );
      if (existing) {
        const updated = removeBookmarkFromStorage(existing.id);
        setBookmarks(updated);
      }
    } else {
      const monument =
        (msg.monumentName &&
          monuments.find((m) => m.name.toLowerCase() === msg.monumentName?.toLowerCase())) ||
        selectedMonument;

      saveBookmarkToStorage({
        messageId: msg.id,
        monumentName: msg.monumentName || monument?.name || 'Indian Monument',
        monumentLocation: msg.monumentLocation || monument?.location || 'India',
        mode: msg.mode,
        title: `${msg.monumentName || monument?.name || 'Monument'} Story`,
        content: msg.content,
      });

      setBookmarks(getStoredBookmarks());
    }
  };

  const handleRemoveBookmark = (bookmarkId: string) => {
    const updated = removeBookmarkFromStorage(bookmarkId);
    setBookmarks(updated);
  };

  const handleClearAllBookmarks = () => {
    clearAllBookmarksFromStorage();
    setBookmarks([]);
  };

  const handleSelectMonumentToExplore = (monumentName: string) => {
    const matched = monuments.find(
      (m) =>
        m.name.toLowerCase().includes(monumentName.toLowerCase()) ||
        monumentName.toLowerCase().includes(m.name.toLowerCase())
    );
    if (matched) {
      setSelectedMonument(matched);
      handleSendMessage(`Tell me a story about ${matched.name}`, 'story');
    } else {
      handleSendMessage(`Tell me a story about ${monumentName}`, 'story');
    }
  };

  const customDocsCount = monuments.filter((m) => m.isCustom).length;

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30 text-stone-900 font-['Plus_Jakarta_Sans']">
      {/* Top Header */}
      <Header
        monumentsCount={monuments.length}
        customDocsCount={customDocsCount}
        bookmarksCount={bookmarks.length}
        onOpenBookmarksModal={() => setIsBookmarksModalOpen(true)}
        onOpenKnowledgeModal={() => setIsKnowledgeModalOpen(true)}
        onResetChat={handleResetChat}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 flex flex-col">
        {/* Monument Carousel / Selector */}
        <MonumentCarousel
          monuments={monuments}
          selectedMonumentId={selectedMonument?.id}
          onSelectMonument={handleSelectMonument}
          onTestUnknownMonument={handleTestUnknownMonument}
        />

        {/* Storytelling Mode Selector (Rule 4) */}
        <ModeSelector
          currentMode={mode}
          onSelectMode={setMode}
          onQuickAction={handleQuickAction}
          selectedMonumentName={selectedMonument?.name}
          disabled={isLoading}
        />

        {/* Conversation Message Feed */}
        <div className="flex-1 bg-amber-100/20 border border-amber-200/60 rounded-2xl p-4 sm:p-6 mb-4 min-h-[420px] shadow-inner overflow-y-auto">
          {messages.map((msg) => (
            <ChatMessageView
              key={msg.id}
              message={msg}
              onSpeak={(text) => handleSpeakMessage(msg.id, text)}
              onStopSpeak={handleStopSpeaking}
              isSpeakingThis={isSpeaking && speakingMessageId === msg.id}
              onSelectMonumentChip={(m) => handleSelectMonument(m)}
              availableMonuments={monuments}
              isBookmarked={isMessageBookmarked(bookmarks, msg.id, msg.content)}
              onToggleBookmark={() => handleToggleBookmark(msg)}
            />
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl p-4 max-w-md shadow-xs animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-amber-800 text-amber-100 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <span className="text-xs font-semibold text-stone-800 block font-['Cinzel']">
                  Consulting Monument Knowledge Archives...
                </span>
                <span className="text-[11px] text-stone-500">
                  Grounding strictly on verified knowledge files
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="sticky bottom-3 z-20 bg-white/95 backdrop-blur-xs border border-amber-200/90 rounded-2xl p-2.5 sm:p-3 shadow-lg">
          {/* Voice Assistant Status, Accessibility & Auto-Speak Mode Toggle */}
          <VoiceStatusBar
            isListening={isListening}
            isProcessing={isSpeechProcessing}
            isSpeaking={isSpeaking}
            autoSpeak={autoSpeak}
            onToggleAutoSpeak={handleToggleAutoSpeak}
            speechError={speechError}
            onDismissError={resetTranscript}
            isSpeechSupported={isSpeechSupported}
            onStopSpeaking={handleStopSpeaking}
            onStopListening={stopListening}
            interimTranscript={interimTranscript}
            selectedLanguage="English (India)"
          />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 rounded-lg text-amber-900 border border-amber-200 text-xs flex-shrink-0">
              <Landmark className="w-3.5 h-3.5 text-amber-700" />
              <span className="font-semibold hidden sm:inline max-w-[120px] truncate">
                {selectedMonument?.name || 'All Monuments'}
              </span>
            </div>

            <input
              ref={inputRef}
              type="text"
              id="storyteller-query-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening to your voice in English (India)... speak now'
                  : `Ask Heritage Storyteller about ${selectedMonument?.name || 'monuments'}, e.g. "Tell me the story of Ellora Caves"...`
              }
              disabled={isLoading}
              className={`flex-1 text-xs sm:text-sm bg-stone-50/80 focus:bg-white border rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-amber-700/50 text-stone-900 placeholder:text-stone-400 ${
                isListening ? 'border-red-400 ring-2 ring-red-300/40 bg-red-50/20' : 'border-stone-200'
              }`}
            />

            {/* Requirement 1 & 4: Microphone button (🎤) with min-h-[44px] min-w-[44px] */}
            <button
              type="button"
              id="voice-microphone-btn"
              onClick={handleToggleVoiceInput}
              disabled={isLoading}
              className={`min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs flex-shrink-0 select-none ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-300 animate-pulse'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
              }`}
              title={
                isListening
                  ? 'Listening... Click to finish voice input'
                  : 'Voice Input: Speak your monument question (English - India)'
              }
              aria-label={isListening ? 'Stop microphone listening' : 'Start voice input (English - India)'}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 text-white animate-bounce" />
                  <span className="hidden sm:inline font-bold">Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-amber-800" />
                  <span className="hidden sm:inline">Voice</span>
                </>
              )}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              id="send-query-btn"
              disabled={isLoading || !input.trim()}
              className="min-h-[44px] min-w-[44px] bg-amber-800 hover:bg-amber-900 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs flex-shrink-0"
              aria-label="Send exploration query"
            >
              <span className="hidden xs:inline">Explore</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Voice Suggestions */}
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-amber-100 overflow-x-auto text-[11px]">
            <span className="text-stone-500 font-medium whitespace-nowrap flex items-center gap-1">
              <Mic className="w-3 h-3 text-amber-700" />
              Try saying:
            </span>
            <button
              type="button"
              onClick={() => handleSendMessage('Tell me the story of Ellora Caves', 'story')}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 transition-colors border border-stone-200 cursor-pointer"
            >
              "Tell me the story of Ellora Caves"
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Act as a tourist guide for Taj Mahal', 'guide')}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 transition-colors border border-stone-200 cursor-pointer"
            >
              "Act as a tourist guide for Taj Mahal"
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Give me facts about Konark Sun Temple', 'facts')}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 transition-colors border border-stone-200 cursor-pointer hidden sm:inline-block"
            >
              "Give me facts about Konark Sun Temple"
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1 mt-2 px-1 text-[11px] text-stone-500">
            <span className="flex items-center gap-1 text-stone-600">
              <Sparkles className="w-3 h-3 text-amber-700" />
              Grounded exclusively in uploaded monument knowledge files
            </span>
            <span className="text-[10px] text-stone-400 hidden sm:inline">
              Rule 2 format: Overview • History • Architecture • Facts • Story
            </span>
          </div>
        </div>
      </main>

      {/* Floating Audio Narration Controller */}
      <AudioNarrationBar
        isSpeaking={isSpeaking}
        isPaused={isPaused}
        onPause={pause}
        onResume={resume}
        onStop={handleStopSpeaking}
      />

      {/* Knowledge Base Repository Modal */}
      <KnowledgeBaseModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
        monuments={monuments}
        onUploadDoc={handleUploadDocument}
        onDeleteDoc={handleDeleteDocument}
        onResetDefault={handleResetDefault}
      />

      {/* Bookmarked Monument Stories Modal */}
      <BookmarksModal
        isOpen={isBookmarksModalOpen}
        onClose={() => setIsBookmarksModalOpen(false)}
        bookmarks={bookmarks}
        onRemoveBookmark={handleRemoveBookmark}
        onClearAllBookmarks={handleClearAllBookmarks}
        onSpeak={(text) => speak(text)}
        onStopSpeak={handleStopSpeaking}
        isSpeaking={isSpeaking}
        onSelectMonumentToExplore={handleSelectMonumentToExplore}
      />
    </div>
  );
}
