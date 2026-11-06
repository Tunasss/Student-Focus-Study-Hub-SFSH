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
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const [scanningStage, setScanningStage] = useState(0);
  const [extractedChapters, setExtractedChapters] = useState([]);
  const [importMode, setImportMode] = useState('append'); // 'append' | 'replace'
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
      dropSubtitle: 'Drag and drop your syllabus or chapter slide PDFs here, or click to browse.',
      supportedFormats: 'Supports PDF, Word (.docx), PowerPoint (.pptx), and TXT (up to 20 files, max 50MB)',
      selectedFiles: (count) => `Selected Documents (${count})`,
      removeFileTooltip: (name) => `Remove ${name}`,
      startExtractBtn: '✨ Extract Topics with Gemini AI',
      fileTooBig: 'File size exceeds 15MB limit.',
      tooManyFiles: 'Cannot upload more than 20 files at once.',
      invalidType: 'Unsupported file format. Please upload PDF, Word, PowerPoint, or TXT.',
      // Step 2
      scanningTitle: 'NotebookLM Engine Analyzing Syllabus',
      scanningSubtitle: (count) =>
        `Extracting chapters and key subtopics across ${count} ${count === 1 ? 'file' : 'files'} with Gemini AI…`,
      stages: [
        'Reading document layout and structure…',
        'Identifying chapter hierarchy with Gemini AI…',
        'Synthesizing subtopics and competencies…',
        'Finalizing curriculum knowledge tree…',
      ],
      // Step 3
      previewTitle: 'Review & Organize Knowledge Tree',
      previewSubtitle: (chCount) =>
        `Synthesized ${chCount} chapters with nested subtopics. Edit, organize, or prune items before saving to ${courseInfo.code}.`,
      modeLabel: 'Import Mode:',
      modeAppend: 'Append to existing syllabus',
      modeReplace: 'Replace entire syllabus',
      chapterBadge: 'Chapter',
      subtopicBadge: 'Subtopic',
      titlePlaceholder: 'Chapter Title…',
      descPlaceholder: 'Key concepts, chapters and learning outcomes…',
      subtopicTitlePlaceholder: 'Subtopic / section name…',
      subtopicDescPlaceholder: 'Key details (optional)…',
      deleteTopicTooltip: 'Remove this chapter',
      deleteSubtopicTooltip: 'Remove this subtopic',
      addSubtopicBtn: '+ Add Subtopic',
      addChapterBtn: '+ Add Chapter Manually',
      backToUpload: '← Upload Another File',
      cancelBtn: 'Cancel',
      confirmImportBtn: (count) => `💾 Import ${count} ${count === 1 ? 'Topic' : 'Topics'} to Syllabus`,
      savingText: 'Saving syllabus chapters…',
      noTopicsNotice: 'No chapters left. Click "+ Add Chapter Manually" or upload a different file.',
    },
    vi: {
      modalBadge: '✨ TÁCH ĐỀ CƯƠNG BẰNG AI · NOTEBOOKLM CORE',
      targetCourse: 'Môn học mục tiêu:',
      stepUpload: '1. Tải tài liệu',
      stepScan: '2. AI phân tích',
      stepReview: '3. Xem & Sắp xếp',
      // Step 1
      dropTitle: 'Tải lên đề cương môn học',
      dropSubtitle: 'Kéo thả file đề cương hoặc slide từng chương vào đây hoặc bấm để chọn tệp.',
      supportedFormats: 'Hỗ trợ PDF, Word (.docx), PowerPoint (.pptx) và TXT (tối đa 20 file, 50MB)',
      selectedFiles: (count) => `Tài liệu đã chọn (${count})`,
      removeFileTooltip: (name) => `Xóa ${name}`,
      startExtractBtn: '✨ Phân tích chương mục bằng Gemini AI',
      fileTooBig: 'Kích thước file vượt quá giới hạn 15MB.',
      tooManyFiles: 'Không thể tải lên quá 20 file cùng lúc.',
      invalidType: 'Định dạng file không hỗ trợ. Vui lòng chọn PDF, Word, PowerPoint hoặc TXT.',
      // Step 2
      scanningTitle: 'NotebookLM AI đang phân tích đề cương',
      scanningSubtitle: (count) =>
        `Tự động trích xuất cấu trúc chương mục và các kiến thức con trên ${count} tài liệu bằng Gemini AI…`,
      stages: [
        'Đang đọc cấu trúc và các tiêu đề văn bản…',
        'Phân rã chương mục kiến thức bằng Gemini AI…',
        'Tổng hợp danh mục kiến thức con và chuẩn đầu ra…',
        'Hoàn thiện cây kiến thức môn học…',
      ],
      // Step 3
      previewTitle: 'Xem trước & Sắp xếp cây kiến thức',
      previewSubtitle: (chCount) =>
        `Đã tổng hợp ${chCount} chương kèm mục con. Bạn có thể chỉnh sửa tên, mô tả hoặc loại bỏ mục không cần thiết trước khi lưu vào ${courseInfo.code}.`,
      modeLabel: 'Chế độ lưu:',
      modeAppend: 'Bổ sung vào giáo trình hiện tại',
      modeReplace: 'Thay thế toàn bộ giáo trình',
      chapterBadge: 'Chương',
      subtopicBadge: 'Mục con',
      titlePlaceholder: 'Tên chương / chủ đề…',
      descPlaceholder: 'Khái niệm cốt lõi, kiến thức trọng tâm…',
      subtopicTitlePlaceholder: 'Tên mục con / nội dung chi tiết…',
      subtopicDescPlaceholder: 'Mô tả nội dung con (tùy chọn)…',
      deleteTopicTooltip: 'Xóa chương này',
      deleteSubtopicTooltip: 'Xóa mục con này',
      addSubtopicBtn: '+ Thêm mục con',
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
    setFiles([]);
    setIsDragOver(false);
    setError('');
    setScanningStage(0);
    setExtractedChapters([]);
    setImportMode('append');
    setIsSaving(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose?.();
  }, [handleReset, onClose]);

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

  function validateAndAddFiles(newFiles) {
    setError('');
    if (!newFiles || newFiles.length === 0) return;

    const fileList = Array.from(newFiles);
    if (files.length + fileList.length > 20) {
      setError(t.tooManyFiles);
      return;
    }

    const validExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.txt'];
    const added = [];

    for (const f of fileList) {
      if (f.size > 15 * 1024 * 1024) {
        setError(t.fileTooBig);
        return;
      }
      const lower = f.name.toLowerCase();
      if (!validExtensions.some((ext) => lower.endsWith(ext))) {
        setError(t.invalidType);
        return;
      }
      added.push(f);
    }

    setFiles((prev) => [...prev, ...added]);
  }

  function handleRemoveFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleFileChange(e) {
    if (e.target.files) validateAndAddFiles(e.target.files);
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
    if (e.dataTransfer.files) validateAndAddFiles(e.dataTransfer.files);
  }

  // Step 1 -> Step 2: Extraction execution
  async function handleStartExtraction() {
    if (files.length === 0 || !course?.id) return;
    setStep('SCANNING');
    setError('');
    setScanningStage(0);

    const stageTimer = setInterval(() => {
      setScanningStage((prev) => (prev < 3 ? prev + 1 : prev));
    }, 450);

    const startTime = Date.now();

    try {
      const response = await syllabusApi.extractSyllabus(files, course.name);

      const elapsed = Date.now() - startTime;
      if (minScanDelayMs > 0 && elapsed < minScanDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, minScanDelayMs - elapsed));
      }

      clearInterval(stageTimer);

      // Normalize response: may be raw array or { chapters: [...], topics: [...] }
      const rawChapters = response?.chapters || (Array.isArray(response) ? response : (response?.topics || []));

      const formatted = rawChapters.map((ch, idx) => ({
        id: `extracted-ch-${Date.now()}-${idx}`,
        title: ch.title || `${t.chapterBadge} ${idx + 1}`,
        description: ch.description || '',
        sourceFile: ch.sourceFile || ch.source_file || (files.length === 1 ? files[0].name : null),
        sortOrder: currentTopicsCount + idx + 1,
        status: ch.status || 'TODO',
        subtopics: (ch.subtopics || []).map((sub, subIdx) => ({
          id: `extracted-sub-${Date.now()}-${idx}-${subIdx}`,
          title: sub.title || `${t.subtopicBadge} ${subIdx + 1}`,
          description: sub.description || '',
          sortOrder: subIdx + 1,
          status: sub.status || 'TODO',
        })),
      }));

      setExtractedChapters(formatted);
      setStep('PREVIEW');
    } catch {
      clearInterval(stageTimer);
      setError('AI extraction failed. Please try again or check the file.');
      setStep('UPLOAD');
    }
  }

  // Chapter and subtopic editing
  function handleChapterChange(chIdx, field, value) {
    setExtractedChapters((prev) =>
      prev.map((ch, i) => (i === chIdx ? { ...ch, [field]: value } : ch))
    );
  }

  function handleDeleteChapter(chIdx) {
    setExtractedChapters((prev) =>
      prev.filter((_, i) => i !== chIdx).map((ch, i) => ({
        ...ch,
        sortOrder: currentTopicsCount + i + 1,
      }))
    );
  }

  function handleAddChapter() {
    const nextOrder = currentTopicsCount + extractedChapters.length + 1;
    setExtractedChapters((prev) => [
      ...prev,
      {
        id: `manual-ch-${Date.now()}`,
        title: `${t.chapterBadge} ${extractedChapters.length + 1}: `,
        description: '',
        sourceFile: null,
        sortOrder: nextOrder,
        status: 'TODO',
        subtopics: [],
      },
    ]);
  }

  function handleAddSubtopic(chIdx) {
    setExtractedChapters((prev) =>
      prev.map((ch, i) => {
        if (i !== chIdx) return ch;
        const nextSubOrder = (ch.subtopics || []).length + 1;
        return {
          ...ch,
          subtopics: [
            ...(ch.subtopics || []),
            {
              id: `manual-sub-${Date.now()}-${nextSubOrder}`,
              title: `${t.subtopicBadge} ${nextSubOrder}: `,
              description: '',
              sortOrder: nextSubOrder,
              status: 'TODO',
            },
          ],
        };
      })
    );
  }

  function handleSubtopicChange(chIdx, subIdx, field, value) {
    setExtractedChapters((prev) =>
      prev.map((ch, i) => {
        if (i !== chIdx) return ch;
        return {
          ...ch,
          subtopics: ch.subtopics.map((sub, j) => (j === subIdx ? { ...sub, [field]: value } : sub)),
        };
      })
    );
  }

  function handleDeleteSubtopic(chIdx, subIdx) {
    setExtractedChapters((prev) =>
      prev.map((ch, i) => {
        if (i !== chIdx) return ch;
        return {
          ...ch,
          subtopics: ch.subtopics.filter((_, j) => j !== subIdx).map((sub, j) => ({
            ...sub,
            sortOrder: j + 1,
          })),
        };
      })
    );
  }

  async function handleConfirmImport() {
    if (extractedChapters.length === 0) return;
    setIsSaving(true);
    try {
      // Package chapters with array contract and mode property for full compatibility
      const result = [...extractedChapters];
      result.mode = importMode;
      result.chapters = extractedChapters;

      await onImportSuccess?.(result);
      handleClose();
    } catch {
      setError('Failed to import topics into course.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-extractor-title"
    >
      <div className="glass-card border border-border/90 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Glow ambient decoration */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border/60 flex items-start justify-between gap-4 shrink-0 bg-surface/50">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-mono font-bold tracking-wide">
              {t.modalBadge}
            </div>
            <h2 id="ai-extractor-title" className="text-lg sm:text-xl font-black text-text tracking-tight mt-1">
              {t.dropTitle}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              <span className="font-semibold text-text/80">{t.targetCourse}</span>{' '}
              <span className="text-primary font-bold">{courseInfo.code}</span> — {courseInfo.name}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stepper Indicator */}
        <div className="px-6 py-2.5 bg-surface/30 border-b border-border/40 flex items-center gap-6 text-[11px] font-semibold shrink-0">
          <span className={step === 'UPLOAD' ? 'text-primary font-bold' : 'text-muted'}>{t.stepUpload}</span>
          <span className="text-border">›</span>
          <span className={step === 'SCANNING' ? 'text-primary font-bold' : 'text-muted'}>{t.stepScan}</span>
          <span className="text-border">›</span>
          <span className={step === 'PREVIEW' ? 'text-primary font-bold' : 'text-muted'}>{t.stepReview}</span>
        </div>

        {/* Modal Content */}
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
                    ? 'border-primary bg-primary/10 shadow-lg scale-[0.99]'
                    : 'border-border/80 hover:border-primary/60 bg-surface/30 hover:bg-surface/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
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

              {/* Selected Files Chip List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-text">
                    <span>{t.selectedFiles(files.length)}</span>
                    <button
                      type="button"
                      onClick={() => setFiles([])}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                    >
                      {t.changeFile}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {files.map((f, idx) => (
                      <div
                        key={`${f.name}-${idx}`}
                        className="p-3 rounded-2xl bg-surface/80 border border-border/80 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl shrink-0">📑</span>
                          <div className="truncate">
                            <p className="text-xs font-bold text-text truncate">{f.name}</p>
                            <p className="text-[10px] text-muted font-mono">
                              {(f.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          aria-label={t.removeFileTooltip(f.name)}
                          className="p-1 rounded-lg text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: AI SCANNING ANIMATION */}
          {step === 'SCANNING' && (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">✨</div>
              </div>

              <div className="space-y-1.5 max-w-md">
                <h3 className="text-base font-bold text-text tracking-tight">{t.scanningTitle}</h3>
                <p className="text-xs text-muted">{t.scanningSubtitle(files.length)}</p>
              </div>

              {/* Dynamic stage progress indicator */}
              <div className="w-full max-w-sm space-y-2">
                <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden border border-border/60">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${((scanningStage + 1) / 4) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] font-mono text-primary font-medium animate-pulse">
                  {t.stages[scanningStage] || t.stages[0]}
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & ORGANIZE KNOWLEDGE TREE */}
          {step === 'PREVIEW' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
                <div>
                  <h3 className="text-sm font-bold text-text tracking-tight">{t.previewTitle}</h3>
                  <p className="text-xs text-muted">{t.previewSubtitle(extractedChapters.length)}</p>
                </div>

                {/* Import Mode Toggle: Append vs Replace */}
                <div className="flex items-center gap-3 text-xs bg-surface/80 p-1.5 rounded-2xl border border-border/70 shrink-0">
                  <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl cursor-pointer hover:bg-surface font-medium transition-colors">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-primary focus:ring-0"
                    />
                    <span>{t.modeAppend}</span>
                  </label>
                  <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl cursor-pointer hover:bg-surface font-medium transition-colors">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-primary focus:ring-0"
                    />
                    <span>{t.modeReplace}</span>
                  </label>
                </div>
              </div>

              {extractedChapters.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted rounded-2xl border border-dashed border-border">
                  {t.noTopicsNotice}
                </div>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  {extractedChapters.map((ch, chIdx) => (
                    <div
                      key={ch.id || chIdx}
                      className="p-4 rounded-3xl bg-surface/60 border border-border/80 space-y-3 relative group shadow-xs hover:border-primary/40 transition-all"
                    >
                      {/* Chapter header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold font-mono">
                            {t.chapterBadge} {chIdx + 1}
                          </span>
                          {ch.sourceFile && (
                            <span className="px-2 py-0.5 rounded-md bg-surface border border-border/70 text-[10px] text-muted font-mono truncate max-w-xs">
                              📄 {ch.sourceFile}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteChapter(chIdx)}
                          className="p-1 rounded-lg text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          aria-label="Remove chapter"
                          title={t.deleteTopicTooltip}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Chapter Title & Description */}
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={ch.title}
                          onChange={(e) => handleChapterChange(chIdx, 'title', e.target.value)}
                          placeholder={t.titlePlaceholder}
                          className="w-full px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-bold text-text focus:outline-none focus:border-primary"
                        />
                        <textarea
                          value={ch.description}
                          onChange={(e) => handleChapterChange(chIdx, 'description', e.target.value)}
                          placeholder={t.descPlaceholder}
                          rows={2}
                          className="w-full px-3 py-1.5 rounded-xl bg-background border border-border text-xs text-muted focus:outline-none focus:border-primary resize-none"
                        />
                      </div>

                      {/* Subtopics Checklist Container */}
                      <div className="pl-4 sm:pl-6 border-l-2 border-primary/20 space-y-2 mt-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
                            {t.subtopicBadge}s ({ch.subtopics?.length || 0})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddSubtopic(chIdx)}
                            className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                          >
                            {t.addSubtopicBtn}
                          </button>
                        </div>

                        {(ch.subtopics || []).map((sub, subIdx) => (
                          <div
                            key={sub.id || subIdx}
                            className="p-2.5 rounded-2xl bg-surface/90 border border-border/60 flex items-start gap-2 group/sub"
                          >
                            <span className="text-primary text-xs mt-1 shrink-0">✦</span>
                            <div className="grow space-y-1">
                              <input
                                type="text"
                                value={sub.title}
                                onChange={(e) => handleSubtopicChange(chIdx, subIdx, 'title', e.target.value)}
                                placeholder={t.subtopicTitlePlaceholder}
                                className="w-full px-2.5 py-1 rounded-lg bg-background border border-border/70 text-xs font-medium text-text focus:outline-none focus:border-primary"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubtopic(chIdx, subIdx)}
                              className="p-1 rounded-md text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0 mt-0.5"
                              aria-label="Remove subtopic"
                              title={t.deleteSubtopicTooltip}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action: Add Chapter Manually */}
              <button
                type="button"
                onClick={handleAddChapter}
                className="w-full py-2.5 rounded-2xl border border-dashed border-primary/50 text-primary text-xs font-bold hover:bg-primary/10 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {t.addChapterBtn}
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border/60 bg-surface/50 flex items-center justify-between gap-3 shrink-0">
          {step === 'PREVIEW' ? (
            <button
              type="button"
              onClick={() => setStep('UPLOAD')}
              className="text-xs text-muted hover:text-text font-medium cursor-pointer"
            >
              {t.backToUpload}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-muted hover:text-text transition-colors cursor-pointer"
            >
              {t.cancelBtn}
            </button>
          )}

          {step === 'UPLOAD' && (
            <button
              type="button"
              disabled={files.length === 0}
              onClick={handleStartExtraction}
              className="px-6 py-2.5 rounded-full bg-primary text-primary-fg text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {t.startExtractBtn}
            </button>
          )}

          {step === 'PREVIEW' && (
            <button
              type="button"
              disabled={extractedChapters.length === 0 || isSaving}
              onClick={handleConfirmImport}
              className="px-6 py-2.5 rounded-full bg-primary text-primary-fg text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-2"
            >
              {isSaving ? t.savingText : t.confirmImportBtn(extractedChapters.length)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
