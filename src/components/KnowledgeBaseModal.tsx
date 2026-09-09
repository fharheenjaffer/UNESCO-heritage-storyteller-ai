import React, { useState, useRef } from 'react';
import { MonumentKnowledgeDoc } from '../types';
import {
  X,
  FileText,
  Upload,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Sparkles,
  BookOpen,
  MapPin,
  Calendar,
} from 'lucide-react';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  monuments: MonumentKnowledgeDoc[];
  onUploadDoc: (doc: Partial<MonumentKnowledgeDoc>) => Promise<boolean>;
  onDeleteDoc: (id: string) => Promise<boolean>;
  onResetDefault: () => Promise<void>;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  monuments,
  onUploadDoc,
  onDeleteDoc,
  onResetDefault,
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'upload'>('view');
  const [selectedDocId, setSelectedDocId] = useState<string>(monuments[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');

  // Upload form states
  const [monumentName, setMonumentName] = useState('');
  const [monumentLocation, setMonumentLocation] = useState('');
  const [monumentState, setMonumentState] = useState('');
  const [builtBy, setBuiltBy] = useState('');
  const [era, setEra] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filteredMonuments = monuments.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.era && m.era.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeDoc = monuments.find((m) => m.id === selectedDocId) || monuments[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          setMonumentName(parsed.name || file.name.replace(/\.[^/.]+$/, ''));
          setMonumentLocation(parsed.location || 'India');
          setMonumentState(parsed.state || '');
          setBuiltBy(parsed.builtBy || '');
          setEra(parsed.era || '');
          setContent(parsed.content || JSON.stringify(parsed, null, 2));
        } else {
          // txt or md file
          const guessedName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setMonumentName(guessedName);
          setContent(text);
        }
        setActiveTab('upload');
      } catch (err: any) {
        setFeedback({ type: 'error', message: 'Failed to read file: ' + err.message });
      }
    };
    reader.readAsText(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monumentName.trim() || !content.trim()) {
      setFeedback({ type: 'error', message: 'Monument Name and Knowledge Content are required.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const success = await onUploadDoc({
      name: monumentName.trim(),
      location: monumentLocation.trim() || 'India',
      state: monumentState.trim(),
      builtBy: builtBy.trim(),
      era: era.trim(),
      content: content.trim(),
      highlights: ['Custom Uploaded Monument Document'],
    });

    setIsSubmitting(false);

    if (success) {
      setFeedback({ type: 'success', message: `"${monumentName}" successfully added to knowledge base!` });
      setMonumentName('');
      setMonumentLocation('');
      setMonumentState('');
      setBuiltBy('');
      setEra('');
      setContent('');
      setTimeout(() => {
        setActiveTab('view');
      }, 1200);
    } else {
      setFeedback({ type: 'error', message: 'Failed to upload document. Please try again.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-amber-900 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-amber-800">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-['Cinzel'] font-bold text-base sm:text-lg text-amber-100">
                Monument Knowledge Repository
              </h3>
              <p className="text-xs text-amber-200/80">
                Rule 1: "Use ONLY the information available in the uploaded monument knowledge files."
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white p-1 rounded-lg hover:bg-amber-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('view')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'view'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Browse Collection ({monuments.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'upload'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload New Knowledge File</span>
            </button>
          </div>

          <button
            onClick={onResetDefault}
            className="text-[11px] text-stone-500 hover:text-amber-800 underline"
            title="Reload default iconic monuments knowledge set"
          >
            Reset Default Collection
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'view' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left column: File list */}
              <div className="md:col-span-5 border-r-0 md:border-r border-stone-200 pr-0 md:pr-4 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Filter monuments by name or state..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-amber-600 mb-2"
                />

                <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
                  {filteredMonuments.map((doc) => {
                    const isSelected = activeDoc?.id === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-50 border-amber-600 shadow-xs'
                            : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <FileCode className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-amber-800' : 'text-stone-400'}`} />
                            <h4 className="text-xs font-semibold text-stone-900 truncate">
                              {doc.name}
                            </h4>
                          </div>
                          <p className="text-[11px] text-stone-500 truncate mt-0.5">
                            {doc.location}
                          </p>
                        </div>
                        {doc.isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteDoc(doc.id);
                            }}
                            className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                            title="Delete custom file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right column: Document details */}
              <div className="md:col-span-7 pl-0 md:pl-2">
                {activeDoc ? (
                  <div className="bg-stone-50/70 border border-stone-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-stone-200">
                      <div>
                        <h3 className="font-['Cinzel'] font-bold text-base text-stone-900">
                          {activeDoc.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-700" />
                            {activeDoc.location}
                          </span>
                          {activeDoc.era && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-amber-700" />
                              {activeDoc.era}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold uppercase">
                        {activeDoc.isCustom ? 'Custom Upload' : 'Verified Archive'}
                      </span>
                    </div>

                    <div className="mb-3">
                      <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                        Archived Knowledge File Content:
                      </span>
                      <pre className="text-xs font-mono bg-white border border-stone-200 rounded-lg p-3 text-stone-800 whitespace-pre-wrap max-h-[380px] overflow-y-auto leading-relaxed">
                        {activeDoc.content}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-stone-500 text-xs">
                    Select a monument file to inspect its contents.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Upload Tab */
            <div className="max-w-2xl mx-auto py-2">
              <div className="mb-4">
                <h4 className="font-['Cinzel'] text-sm font-bold text-stone-900 mb-1">
                  Add Monument Knowledge Document
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Upload a <code>.txt</code>, <code>.md</code>, or <code>.json</code> file or manually paste text.
                  Heritage Storyteller AI will use this document to formulate verified historical stories, architecture highlights, and facts.
                </p>
              </div>

              {feedback && (
                <div
                  className={`p-3 rounded-xl mb-4 flex items-center gap-2 text-xs ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Drag and drop / file input box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer bg-amber-50/30 hover:bg-amber-50/60 transition-colors mb-4"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-amber-700 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-stone-800">
                  Click to choose file or drag & drop here (.txt, .md, .json)
                </p>
                <p className="text-[11px] text-stone-500">
                  Pre-fills the form below automatically
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Monument Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Golconda Fort"
                      value={monumentName}
                      onChange={(e) => setMonumentName(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Location / City, State
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hyderabad, Telangana, India"
                      value={monumentLocation}
                      onChange={(e) => setMonumentLocation(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Patron / Builder / Dynasty
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kakatiya Dynasty & Qutb Shahi Dynasty"
                      value={builtBy}
                      onChange={(e) => setBuiltBy(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Historical Era / Century
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 12th–16th Century CE"
                      value={era}
                      onChange={(e) => setEra(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Knowledge Document Content *
                  </label>
                  <textarea
                    required
                    rows={7}
                    placeholder="Enter detailed historical overview, architecture details, legends, and verified facts..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('view')}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{isSubmitting ? 'Uploading...' : 'Save Knowledge File'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
