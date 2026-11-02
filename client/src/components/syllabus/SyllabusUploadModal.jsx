import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';
import { syllabusApi } from '../../lib/api';
import { formatCourseInfo } from '../../utils/courseFormat';

export function SyllabusUploadModal({
  isOpen,
  course,
  currentTopicsCount = 0,
  minScanDelayMs = import.meta.env.MODE === 'test' ? 0 : 1200,
  onClose,
  onImportSuccess,
}) {
  const { lang } = useLanguage();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState('UPLOAD'); // 'UPLOAD' | 'SCANNING' | 'PREVIEW'
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const [scanningStage, setScanningStage] = useState(0);
  const [extractedTopics, setExtractedTopics] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const courseInfo = course ? formatCourseInfo(course) : { code: 'COURSE', name: 'Course' };

  const t = {
    en: {
      modalBadge: '✨ AI SYLLABUS EXTRACTOR · NOTEBOOKLM POWERED',
      targetCourse: 'Target Course:',
      stepUpload: '1. Upload File',
      stepScan: '2. AI Analysis',
      stepReview: '3. Organize',
      // Step 1
      dropTitle: 'Upload Course Syllabus Document',
      dropSubtitle: 'Drag and drop your syllabus file here, or click to browse.',
      supportedFormats: 'Supports PDF, Word (.docx), PowerPoint (.pptx), and TXT (max 15MB)',
      selectedFile: 'Selected Document',
      changeFile: 'Choose different file',
      startExtractBtn: '✨ Extract Topics with Gemini AI',
      fileTooBig: 'File size exceeds 15MB limit.',
      invalidType: 'Unsupported file format. Please upload PDF, Word, PowerPoint, or TXT.',
      // Step 2
      scanningTitle: 'NotebookLM Engine Analyzing Syllabus',
      scanningSubtitle: 'Extracting chapters, competencies, and learning outcomes with Gemini AI…',
      stages: [
        'Reading document layout and structure…',
        'Identifying chapter hierarchy with Gemini AI…',
        'Synthesizing topic titles and competencies…',
        'Finalizing curriculum roadmap…',
      ],
      // Step 3
      previewTitle: 'Review & Organize Extracted Topics',
      previewSubtitle: `Extracted ${extractedTopics.length} chapters from ${file?.name || 'document'}. Edit or prune topics before importing into ${courseInfo.code}.`,
      chapterBadge: 'Chapter',
      titlePlaceholder: 'Chapter Title…',
      descPlaceholder: 'Key concepts, chapters and learning outcomes…',
      deleteTopicTooltip: 'Remove this chapter',
      addChapterBtn: '+ Add Chapter Manually',
      backToUpload: '← Upload Another File',
      cancelBtn: 'Cancel',
      confirmImportBtn: (count) => `💾 Import ${count} ${count === 1 ? 'Topic' : 'Topics'} to Syllabus`,
      savingText: 'Saving syllabus chapters…',
      noTopicsNotice: 'No topics left. Click "+ Add Chapter Manually" or upload a different file.',
    },
    vi: {
      modalBadge: '✨ TÁCH ĐỀ CƯƠNG BẰNG AI · NOTEBOOKLM CORE',
      targetCourse: 'Môn học mục tiêu:',
      stepUpload: '1. Tải tài liệu',
      stepScan: '2. AI phân tích',
      stepReview: '3. Xem & Sắp xếp',
      // Step 1
      dropTitle: 'Tải lên đề cương môn học',
      dropSubtitle: 'Kéo thả file đề cương vào đây hoặc bấm để chọn tệp từ máy tính.',
      supportedFormats: 'Hỗ trợ PDF, Word (.docx), PowerPoint (.pptx) và TXT (tối đa 15MB)',
      selectedFile: 'Tài liệu đã chọn',
      changeFile: 'Chọn file khác',
      startExtractBtn: '✨ Phân tích chương mục bằng Gemini AI',
      fileTooBig: 'Kích thước file vượt quá giới hạn 15MB.',
      invalidType: 'Định dạng file không hỗ trợ. Vui lòng chọn PDF, Word, PowerPoint hoặc TXT.',
      // Step 2
      scanningTitle: 'NotebookLM AI đang phân tích đề cương',
      scanningSubtitle: 'Tự động trích xuất cấu trúc chương mục và chuẩn đầu ra bằng Gemini AI…',
      stages: [
        'Đang đọc cấu trúc và các tiêu đề văn bản…',
        'Phân rã chương mục kiến thức bằng Gemini AI…',
        'Tổng hợp tên chủ đề và mô tả chuẩn đầu ra…',
        'Hoàn thiện sơ đồ kiến thức môn học…',
      ],
      // Step 3
      previewTitle: 'Xem trước & Sắp xếp chương mục',
      previewSubtitle: `Đã trích xuất ${extractedTopics.length} chương từ ${file?.name || 'tài liệu'}. Bạn có thể chỉnh sửa tên, mô tả hoặc loại bỏ mục không cần thiết trước khi lưu vào ${courseInfo.code}.`,
      chapterBadge: 'Chương',
      titlePlaceholder: 'Tên chương / chủ đề…',
      descPlaceholder: 'Khái niệm cốt lõi, kiến thức trọng tâm…',
      deleteTopicTooltip: 'Xóa chương này',
      addChapterBtn: '+ Thêm chương thủ công',
      backToUpload: '← Chọn file khác',
      cancelBtn: 'Hủy bỏ',
      confirmImportBtn: (count) => `💾 Thêm ${count} chương vào Giáo trình`,
      savingText: 'Đang lưu danh sách chương…',
      noTopicsNotice: 'Danh sách đang trống. Bấm "+ Thêm chương thủ công" hoặc quay lại tải file khác.',
    },
  }[lang] || {};

  const handleReset = useCallback(() => {
    setStep('UPLOAD');
    setFile(null);
    setIsDragOver(false);
    setError('');
    setScanningStage(0);
    setExtractedTopics([]);
    setIsSaving(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose?.();
  }, [handleReset, onClose]);

  // Keyboard shortcut: Escape closes modal (unless in scanning state)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && step !== 'SCANNING') {
        handleClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, handleClose]);

  if (!isOpen) return null;

  // File validation
  function validateAndSetFile(selectedFile) {
    setError('');
    if (!selectedFile) return;

    if (selectedFile.size > 15 * 1024 * 1024) {
      setError(t.fileTooBig);
      return;
    }

    const validExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.txt'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setError(t.invalidType);
      return;
    }

    setFile(selectedFile);
  }

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  }

  // Step 1 -> Step 2: Extraction execution
  async function handleStartExtraction() {
    if (!file || !course?.id) return;
    setStep('SCANNING');
    setError('');
    setScanningStage(0);

    // Dynamic stage progression timer for realistic NotebookLM scanning effect
    const stageTimer = setInterval(() => {
      setScanningStage((prev) => (prev < 3 ? prev + 1 : prev));
    }, 450);

    const startTime = Date.now();

    try {
      // Calls API (with automatic fallback to realistic simulated chapters if backend not yet ready)
      const rawTopics = await syllabusApi.extractSyllabus(course.id, file, course.name);

      // Ensure minimum delay for delightful AI scanning experience
      const elapsed = Date.now() - startTime;
      if (minScanDelayMs > 0 && elapsed < minScanDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, minScanDelayMs - elapsed));
      }

      clearInterval(stageTimer);

      const formatted = (rawTopics || []).map((topic, idx) => ({
        id: `extracted-${Date.now()}-${idx}`,
        title: topic.title || `Chapter ${idx + 1}`,
        description: topic.description || '',
        sortOrder: currentTopicsCount + idx + 1,
        status: topic.status || 'TODO',
      }));

      setExtractedTopics(formatted);
      setStep('PREVIEW');
    } catch {
      clearInterval(stageTimer);
      setError('AI extraction failed. Please try again or check the file.');
      setStep('UPLOAD');
    }
  }

  // Step 3 actions
  function handleTopicChange(idx, field, value) {
    setExtractedTopics((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  function handleDeleteTopic(idx) {
    setExtractedTopics((prev) => {
      const filtered = prev.filter((_, i) => i !== idx);
      // Re-index sortOrder
      return filtered.map((item, i) => ({
        ...item,
        sortOrder: currentTopicsCount + i + 1,
      }));
    });
  }

  function handleAddChapter() {
    const nextOrder = currentTopicsCount + extractedTopics.length + 1;
    setExtractedTopics((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        title: `${t.chapterBadge} ${extractedTopics.length + 1}: `,
        description: '',
        sortOrder: nextOrder,
        status: 'TODO',
      },
    ]);
  }

  async function handleConfirmImport() {
    if (extractedTopics.length === 0) return;
    setIsSaving(true);
    try {
      await onImportSuccess?.(extractedTopics);
      handleClose();
    } catch {
      setIsSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-extractor-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="glass-card border border-border/90 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border/60 flex items-start justify-between gap-4 shrink-0 bg-surface/50">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-mono font-bold tracking-wide">
              {t.modalBadge}
            </div>
            <h2 id="ai-extractor-title" className="text-lg sm:text-xl font-black text-text tracking-tight mt-1">
              {step === 'UPLOAD' && t.dropTitle}
              {step === 'SCANNING' && t.scanningTitle}
              {step === 'PREVIEW' && t.previewTitle}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              <span className="font-semibold text-text/80">{t.targetCourse}</span>{' '}
              <span className="text-primary font-bold">{courseInfo.code}</span> — {courseInfo.name}
            </p>
          </div>

          {step !== 'SCANNING' && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close modal"
              className="p-1.5 rounded-xl text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Step Indicator Tabs */}
        <div className="px-6 py-2.5 bg-surface/30 border-b border-border/40 flex items-center gap-6 text-[11px] font-semibold shrink-0">
          <span className={step === 'UPLOAD' ? 'text-primary font-bold' : 'text-muted'}>
            {t.stepUpload}
          </span>
          <span className="text-border">›</span>
          <span className={step === 'SCANNING' ? 'text-primary font-bold animate-pulse' : 'text-muted'}>
            {t.stepScan}
          </span>
          <span className="text-border">›</span>
          <span className={step === 'PREVIEW' ? 'text-primary font-bold' : 'text-muted'}>
            {t.stepReview}
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 grow">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD DROPZONE */}
          {step === 'UPLOAD' && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  isDragOver
                    ? 'border-primary bg-primary/10 scale-[1.01]'
                    : 'border-border/80 hover:border-primary/60 bg-surface/30 hover:bg-surface/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-3xl shadow-inner">
                  📄
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-text">{t.dropSubtitle}</p>
                  <p className="text-[11px] text-muted">{t.supportedFormats}</p>
                </div>

                <button
                  type="button"
                  className="mt-2 px-4 py-2 rounded-full bg-surface border border-border text-xs font-semibold text-text hover:border-primary/50 transition-colors pointer-events-none"
                >
                  Browse Files
                </button>
              </div>

              {/* Selected File Card */}
              {file && (
                <div className="p-4 rounded-2xl bg-surface/80 border border-border/80 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">📑</span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-text truncate">{file.name}</p>
                      <p className="text-[10px] text-muted font-mono">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB · {t.selectedFile}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-medium shrink-0 cursor-pointer"
                  >
                    {t.changeFile}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: NOTEBOOKLM AI SCANNING ANIMATION */}
          {step === 'SCANNING' && (
            <div className="py-10 text-center space-y-8">
              {/* Pulsing AI Radar Animation */}
              <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping opacity-75" />
                <div className="absolute -inset-3 rounded-full border border-primary/20 animate-pulse" />
                <div className="w-24 h-24 rounded-full bg-linear-to-tr from-primary/30 to-primary/10 border border-primary/50 flex items-center justify-center shadow-lg shadow-primary/10">
                  <span className="text-4xl animate-bounce">✨</span>
                </div>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-base font-black text-text tracking-tight">
                  {t.scanningSubtitle}
                </h3>
                <p className="text-xs text-primary font-mono font-medium animate-pulse">
                  {t.stages?.[scanningStage] || t.stages?.[0]}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-sm mx-auto h-2 bg-surface rounded-full overflow-hidden border border-border/60">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${((scanningStage + 1) / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & ORGANIZE */}
          {step === 'PREVIEW' && (
            <div className="space-y-4">
              <p className="text-xs text-muted leading-relaxed">{t.previewSubtitle}</p>

              {extractedTopics.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-surface/40 border border-border text-xs text-muted">
                  {t.noTopicsNotice}
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {extractedTopics.map((topic, index) => (
                    <div
                      key={topic.id}
                      className="p-3.5 rounded-2xl bg-surface/70 border border-border/80 hover:border-border transition-all space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[10px] font-mono font-bold">
                            {t.chapterBadge} {index + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteTopic(index)}
                          title={t.deleteTopicTooltip}
                          className="text-muted hover:text-rose-400 p-1 rounded-lg hover:bg-surface transition-colors cursor-pointer text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      <input
                        type="text"
                        value={topic.title}
                        onChange={(e) => handleTopicChange(index, 'title', e.target.value)}
                        placeholder={t.titlePlaceholder}
                        className="w-full px-3 py-1.5 rounded-xl bg-background/60 border border-border text-xs font-bold text-text focus:outline-hidden focus:border-primary transition-colors"
                      />

                      <textarea
                        value={topic.description}
                        onChange={(e) => handleTopicChange(index, 'description', e.target.value)}
                        placeholder={t.descPlaceholder}
                        rows={2}
                        className="w-full px-3 py-1.5 rounded-xl bg-background/60 border border-border text-xs text-muted focus:outline-hidden focus:border-primary transition-colors resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleAddChapter}
                className="w-full py-2.5 rounded-2xl border border-dashed border-border hover:border-primary/60 text-xs font-semibold text-muted hover:text-primary transition-colors cursor-pointer bg-surface/20"
              >
                {t.addChapterBtn}
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border/60 bg-surface/50 flex items-center justify-between gap-3 shrink-0">
          {step === 'UPLOAD' && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-muted hover:text-text transition-colors cursor-pointer"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                disabled={!file}
                onClick={handleStartExtraction}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-fg text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {t.startExtractBtn}
              </button>
            </>
          )}

          {step === 'SCANNING' && (
            <div className="w-full text-center text-xs text-muted py-1 font-mono">
              ⚡ Powered by Google Gemini AI & SFSH Notebook Engine
            </div>
          )}

          {step === 'PREVIEW' && (
            <>
              <button
                type="button"
                onClick={() => setStep('UPLOAD')}
                className="px-4 py-2 rounded-full text-xs font-semibold text-muted hover:text-text transition-colors cursor-pointer"
              >
                {t.backToUpload}
              </button>
              <button
                type="button"
                disabled={extractedTopics.length === 0 || isSaving}
                onClick={handleConfirmImport}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-fg text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {isSaving ? t.savingText : t.confirmImportBtn(extractedTopics.length)}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
