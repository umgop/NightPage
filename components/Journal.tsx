import { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { BookOpen } from 'lucide-react';
import { getFontFamily } from './FontSelector';

interface JournalProps {
  content: string;
  onChange: (content: string) => void;
  isDisabled: boolean;
  sessionEnded: boolean;
  selectedFont: string;
  selectedEffect: string;
}

function sanitizeForDisplay(input: string) {
  // Use DOMPurify to sanitize user content before rendering into innerHTML.
  // Allow only a limited set of tags and attributes to prevent XSS.
  try {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [
        'a', 'b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li', 'img'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'width', 'height', 'style'],
      ALLOWED_URI_REGEXP: /^(https?:|data:image\/)\//
    });
  } catch (e) {
    // Fallback: escape critical characters
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br/>');
  }
}

export function Journal({
  content,
  onChange,
  isDisabled,
  sessionEnded,
  selectedFont,
  selectedEffect,
}: JournalProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fontFamily = getFontFamily(selectedFont);
  const dragStateRef = useRef<{
    img: HTMLImageElement;
    startX: number;
    startY: number;
    startTranslateX: number;
    startTranslateY: number;
    lastTranslateX: number;
    lastTranslateY: number;
    startWidth?: number;
    startHeight?: number;
    resizeHandle?: string;
  } | null>(null);

  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);

  const normalizedHtml = useMemo(() => sanitizeForDisplay(content || ''), [content]);

  useEffect(() => {
    if (editorRef.current && !isDisabled) {
      editorRef.current.focus();
    }
  }, [isDisabled]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== normalizedHtml) el.innerHTML = normalizedHtml;
  }, [normalizedHtml]);

  useEffect(() => {
    if (!selectedImg) return;
    selectedImg.style.outline = '2px solid rgba(100,200,255,0.8)';
    selectedImg.style.outlineOffset = '2px';
    return () => {
      selectedImg.style.outline = '';
      selectedImg.style.outlineOffset = '';
    };
  }, [selectedImg]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const effectClassMap: Record<string, string> = {
    sparkle: 'sparkle-effect',
    glow: 'glow-effect',
    flicker: 'flicker-effect',
    pulse: 'pulse-effect',
    wave: 'wave-effect',
  };

  const getResizeHandleAtPoint = (img: HTMLImageElement, clientX: number, clientY: number): string | null => {
    const rect = img.getBoundingClientRect();
    const handleSize = 16;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    // Corner handles
    if (x < handleSize && y < handleSize) return 'nw';
    if (x > w - handleSize && y < handleSize) return 'ne';
    if (x < handleSize && y > h - handleSize) return 'sw';
    if (x > w - handleSize && y > h - handleSize) return 'se';
    // Edge handles
    if (y < handleSize) return 'n';
    if (y > h - handleSize) return 's';
    if (x < handleSize) return 'w';
    if (x > w - handleSize) return 'e';

    return null;
  };

  const commitHtml = () => {
    const el = editorRef.current;
    if (!el) return;
    onChange(el.innerHTML);
  };

  const handleInput = () => commitHtml();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = document.createElement('img');
      img.src = evt.target?.result as string;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.borderRadius = '8px';
      img.style.margin = '8px 8px 8px 0';
      img.style.cursor = 'grab';
      img.style.display = 'inline-block';
      img.style.float = 'left';
      img.setAttribute('data-journal-img', 'true');
      img.style.width = '400px';
      img.style.verticalAlign = 'top';
      
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.insertNode(img);
        range.setStartAfter(img);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      commitHtml();
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
      return;
    }

    let hasImage = false;
    for (let item of items) {
      if (item.type.indexOf('image') === 0) {
        hasImage = true;
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const img = document.createElement('img');
            img.src = evt.target?.result as string;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.borderRadius = '8px';
            img.style.margin = '8px 8px 8px 0';
            img.style.cursor = 'grab';
            img.style.display = 'inline-block';
            img.style.float = 'left';
            img.setAttribute('data-journal-img', 'true');
            img.style.width = '400px';
            img.style.verticalAlign = 'top';
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
              const range = sel.getRangeAt(0);
              range.insertNode(img);
              range.setStartAfter(img);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            }
            commitHtml();
          };
          reader.readAsDataURL(blob);
        }
        break;
      }
    }

    if (!hasImage) {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'IMG') {
      e.preventDefault();
      e.stopPropagation();
      const img = e.target as HTMLImageElement;
      setSelectedImg(img);
    }
  };

  const handleImageMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!selectedImg) return;
    e.preventDefault();
    e.stopPropagation();

    const resizeHandle = getResizeHandleAtPoint(selectedImg, e.clientX, e.clientY);
    const currentTx = parseFloat(selectedImg.dataset.tx || '0');
    const currentTy = parseFloat(selectedImg.dataset.ty || '0');

    dragStateRef.current = {
      img: selectedImg,
      startX: e.clientX,
      startY: e.clientY,
      startTranslateX: currentTx,
      startTranslateY: currentTy,
      lastTranslateX: currentTx,
      lastTranslateY: currentTy,
      startWidth: selectedImg.width,
      startHeight: selectedImg.height,
      resizeHandle: resizeHandle || undefined,
    };

    selectedImg.style.cursor = resizeHandle ? 'grabbing' : 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStateRef.current || !selectedImg) return;

    const deltaX = e.clientX - dragStateRef.current.startX;
    const deltaY = e.clientY - dragStateRef.current.startY;
    const handle = dragStateRef.current.resizeHandle;

    if (!handle) {
      // Moving only
      const newTx = dragStateRef.current.startTranslateX + deltaX;
      const newTy = dragStateRef.current.startTranslateY + deltaY;
      dragStateRef.current.lastTranslateX = newTx;
      dragStateRef.current.lastTranslateY = newTy;
      selectedImg.style.transform = `translate(${newTx}px, ${newTy}px)`;
      selectedImg.style.cursor = 'grabbing';
    } else {
      // Resizing
      const startWidth = dragStateRef.current.startWidth || selectedImg.width;
      const startHeight = dragStateRef.current.startHeight || selectedImg.height;
      const aspectRatio = startWidth / startHeight;
      let newWidth = startWidth;
      let newHeight = startHeight;

      if (handle.includes('e')) {
        newWidth = startWidth + deltaX;
      } else if (handle.includes('w')) {
        newWidth = startWidth - deltaX;
      }

      if (handle.includes('s')) {
        newHeight = startHeight + deltaY;
      } else if (handle.includes('n')) {
        newHeight = startHeight - deltaY;
      }

      // Maintain aspect ratio
      if (handle.includes('n') || handle.includes('s')) {
        newWidth = newHeight * aspectRatio;
      } else {
        newHeight = newWidth / aspectRatio;
      }

      // Minimum size
      if (newWidth < 100) newWidth = 100;
      if (newHeight < 100) newHeight = 100;

      // Maximum size
      if (newWidth > window.innerWidth - 100) {
        newWidth = window.innerWidth - 100;
        newHeight = newWidth / aspectRatio;
      }

      selectedImg.style.width = `${newWidth}px`;
      selectedImg.style.height = 'auto';
      
      const cursorMap: Record<string, string> = {
        'nw': 'nwse-resize',
        'ne': 'nesw-resize',
        'sw': 'nesw-resize',
        'se': 'nwse-resize',
        'n': 'ns-resize',
        's': 'ns-resize',
        'e': 'ew-resize',
        'w': 'ew-resize',
      };
      selectedImg.style.cursor = cursorMap[handle] || 'grab';
    }
  };

  const handleMouseUp = () => {
    if (dragStateRef.current && selectedImg) {
      const finalTx = dragStateRef.current.lastTranslateX;
      const finalTy = dragStateRef.current.lastTranslateY;

      selectedImg.dataset.tx = String(finalTx);
      selectedImg.dataset.ty = String(finalTy);
      selectedImg.style.cursor = 'grab';

      dragStateRef.current = null;
      commitHtml();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const img = document.createElement('img');
          img.src = evt.target?.result as string;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.borderRadius = '8px';
          img.style.margin = '8px 8px 8px 0';
          img.style.cursor = 'grab';
          img.style.display = 'inline-block';
          img.style.float = 'left';
          img.setAttribute('data-journal-img', 'true');
          img.style.width = '400px';
          img.style.verticalAlign = 'top';

          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.insertNode(img);
            range.setStartAfter(img);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
          commitHtml();
        };
        reader.readAsDataURL(file);
      }
    }
  };


  const currentPlaceholderEmpty = !normalizedHtml || normalizedHtml === '<br/>';

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: '100px 32px 32px 32px',
        boxSizing: 'border-box',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 64,
          paddingBottom: 40,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <BookOpen
            style={{ width: 28, height: 28, color: 'rgba(242,244,243,0.7)', flexShrink: 0 }}
            strokeWidth={1.5}
          />
          <h1
            style={{
              fontSize: 48,
              color: '#f2f4f3',
              margin: 0,
              fontFamily,
              fontWeight: 400,
              letterSpacing: -0.5,
            }}
          >
            Tonight&apos;s Entry
          </h1>
        </div>
        <p
          style={{
            color: 'rgba(242,244,243,0.5)',
            letterSpacing: 1,
            fontFamily,
            fontSize: 13,
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          {currentDate}
        </p>
      </div>

      {/* Placeholder */}
      {currentPlaceholderEmpty && (
        <div
          style={{
            color: 'rgba(242,244,243,0.35)',
            fontFamily,
            fontSize: 17,
            lineHeight: 1.85,
            letterSpacing: 0.3,
            marginBottom: 20,
          }}
        >
          Let your thoughts flow onto the page... (Paste or drag images to add them)
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!isDisabled}
        onInput={handleInput}
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleImageClick}
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).tagName === 'IMG' && selectedImg === e.target) {
            handleImageMouseDown(e as React.MouseEvent<HTMLImageElement>);
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={selectedEffect !== 'none' ? effectClassMap[selectedEffect] || '' : ''}
        style={{
          width: '100%',
          minHeight: 'calc(100vh - 420px)',
          background: 'transparent',
          color: '#f2f4f3',
          outline: 'none',
          fontFamily,
          fontSize: 17,
          lineHeight: 1.85,
          letterSpacing: 0.3,
          border: 'none',
          opacity: isDisabled ? 0.6 : 1,
          cursor: isDisabled ? 'not-allowed' : 'text',
          boxSizing: 'border-box',
          paddingRight: 24,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          position: 'relative',
        }}
        suppressContentEditableWarning
      />


      {/* Footer */}
      <div
        style={{
          marginTop: 64,
          paddingTop: 40,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          textAlign: 'center',
          color: 'rgba(242,244,243,0.35)',
          fontSize: 12,
          letterSpacing: 1.2,
          fontFamily,
          textTransform: 'uppercase',
        }}
      >
        Your words are private. They exist only for this moment.
      </div>

      <style>{`
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 8px 8px 8px 0;
          cursor: grab;
          display: inline-block;
          float: left;
          vertical-align: top;
          transition: opacity 0.2s, filter 0.2s;
        }

        [contenteditable] img:active {
          cursor: grabbing;
        }

        [contenteditable] img:hover {
          filter: brightness(1.05);
        }
      `}</style>
    </div>
  );
}
