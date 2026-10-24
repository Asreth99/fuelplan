import { CSSProperties, KeyboardEvent, PointerEvent, ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "../icons/icon";
import useIsMobile from "../isMobile/isMobile";
import "./modal.css";

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  // "dropdown" opens under `anchor` on desktop; both become a bottom sheet on phones.
  variant?: "dialog" | "dropdown";
  anchor?: HTMLElement | null;
};

// Pulling the phone sheet down this far (px), or flicking it faster than this (px/ms), closes it.
const DRAG_CLOSE_DISTANCE = 120;
const DRAG_CLOSE_SPEED = 0.5;

const FOCUSABLE ='button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])';

/** Dialog shell shared by the car editor, car picker and delete-account confirmation. */
export default function Modal({ title, onClose, children, variant = "dialog", anchor }: Props) {
  const isMobile = useIsMobile();
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CSSProperties>({});

  const dropdown = variant === "dropdown" && !isMobile && anchor;
  useLayoutEffect(() => {
    if (!dropdown) return;
    const rect = anchor.getBoundingClientRect();
    const top = rect.bottom + 8;
    setPosition({ left: rect.left, top, width: rect.width, maxHeight: window.innerHeight - top - 16 });
  }, [dropdown, anchor]);

  // Focus moves into the dialog (to the element marked data-autofocus, if any) and returns on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const target = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current;
    target?.focus();
    return () => opener?.focus();
  }, []);

  // Escape closes; Tab and Shift+Tab stay inside the dialog.
  // Escape is handled here, not on document: React events from this portal bubble to the component
  // that opened it, and the phone's bottom sheet stops Escape there.
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panel.current) return;
    const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Phones: drag the sheet down by its top bar (grabber and title) to close it, as with the trip sheet.
  // A short or slow pull springs back.
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<{ y: number; time: number } | null>(null);
  const dragHandlers = {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("button")) return; // the ✕ stays a plain button
      dragStart.current = { y: e.clientY, time: e.timeStamp };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (dragStart.current) setDragY(Math.max(0, e.clientY - dragStart.current.y));
    },
    onPointerUp: (e: PointerEvent<HTMLDivElement>) => {
      if (!dragStart.current) return;
      const distance = e.clientY - dragStart.current.y;
      const speed = distance / Math.max(e.timeStamp - dragStart.current.time, 1); // px per ms
      dragStart.current = null;
      if (distance > DRAG_CLOSE_DISTANCE || (distance > 20 && speed > DRAG_CLOSE_SPEED)) onClose();
      else setDragY(0);
    },
    onPointerCancel: () => {
      dragStart.current = null;
      setDragY(0);
    },
  };

  const kind = isMobile ? "sheet" : dropdown ? "dropdown" : "dialog";
  const dragging = dragStart.current !== null;
  return createPortal(
    <div
      className={`modal-overlay modal-overlay--${kind}`}
      // On iOS the phone's trip sheet (react-spring-bottom-sheet) blocks touch scrolling everywhere
      // outside itself; this attribute is its opt-out, so long dialogs can still scroll.
      data-body-scroll-lock-ignore=""
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={onKeyDown}
      // Nor may a drag in here start a drag of the phone's trip sheet, which opened the picker.
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div
        ref={panel}
        className={`modal modal--${kind}${dragging ? " modal--dragging" : ""}`}
        style={isMobile ? { transform: dragY ? `translateY(${dragY}px)` : undefined } : position}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="modal__handle" data-testid="dialog-handle" {...(isMobile ? dragHandlers : {})}>
          {isMobile && <span className="modal__grabber" aria-hidden="true" />}
          <header className="modal__head">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
              <Icon name="close" />
            </button>
          </header>
        </div>
        {/* Only the content scrolls; the top bar with the grabber and ✕ always stays in view. */}
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
