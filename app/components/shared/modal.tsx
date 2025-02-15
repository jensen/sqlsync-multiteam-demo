import {
  type MutableRefObject,
  type PropsWithChildren,
  forwardRef,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";

function useClickToClose(
  modalRef: MutableRefObject<HTMLDialogElement | null>,
  open: boolean,
  close: () => void,
  onClose?: () => void
) {
  useEffect(() => {
    const modal = modalRef.current;

    if (modal === null || modal.open === false) return;

    const click = (event: MouseEvent) => {
      event.stopPropagation();

      const rect = modal.children[1].getBoundingClientRect();

      if (
        !(
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        )
      ) {
        close();
      }
    };

    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
      }
    };

    modal.addEventListener("keydown", keydown);
    document.addEventListener("click", click);

    return () => {
      modal.removeEventListener("keydown", keydown);
      document.removeEventListener("click", click);
    };
  }, [open, close]);

  useEffect(() => {
    const modal = modalRef.current;

    if (modal === null) return;

    if (onClose) {
      modal.addEventListener("close", onClose);

      return () => {
        modal.removeEventListener("close", onClose);
      };
    }
  }, [onClose]);

  return;
}

function useDialog() {
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (open) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [open]);

  return {
    ref: modalRef,
    open: useCallback(() => setOpen(true), []),
    close: useCallback(() => setOpen(false), []),
    isOpen: open,
  };
}

export function useModal() {
  const dialog = useDialog();

  useClickToClose(dialog.ref, dialog.isOpen, dialog.close);

  return dialog;
}

export function useRouteModal() {
  const navigate = useNavigate();

  const dialog = useDialog();

  useClickToClose(
    dialog.ref,
    dialog.isOpen,
    dialog.close,
    useCallback(
      () =>
        setTimeout(() => {
          navigate(-1);
        }, 200),
      [navigate]
    )
  );

  return dialog;
}

interface ModalProps extends PropsWithChildren {
  static?: boolean;
}

const Dialog = forwardRef<HTMLDialogElement, ModalProps>((props, ref) => {
  return createPortal(
    <dialog
      tabIndex={-1}
      ref={ref}
      className="modal fixed left-0 top-0 bottom-0 max-w-full max-h-full w-full h-full min-w-full min-h-full m-0 bg-transparent z-50"
    >
      <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden z-20 opacity-80">
        <video
          width="1280"
          height="720"
          autoPlay
          loop
          muted
          playsInline
          className="absolute min-w-[1280px] min-h-[720px] top-0 -translate-y-[80px] left-1/2 -translate-x-1/2"
        >
          <source src="/videos/modal.mp4" type='video/mp4; codecs="hvc1"' />
          <source src="/videos/modal.webm" type="video/webm" />
        </video>
      </div>
      <div className="absolute top-[106px] left-1/2 -translate-x-1/2 w-[646px] h-[188px] z-30 space-y-6 flex flex-col text-zinc-300 border border-zinc-900 bg-zinc-950/75 backdrop-blur-md rounded-xl drop-shadow-modal shadow-button">
        {props.children}
      </div>
    </dialog>,
    document.body
  );
});

export const Modal = forwardRef<HTMLDialogElement, ModalProps>((props, ref) => {
  return <Dialog ref={ref}>{props.children}</Dialog>;
});

interface StaticModalProps extends PropsWithChildren {
  open: () => void;
}

export const StaticModal = forwardRef<HTMLDialogElement, StaticModalProps>(
  (props, ref) => {
    useEffect(() => {
      props.open();
    }, [props.open]);

    return <Dialog ref={ref}>{props.isOpen && props.children}</Dialog>;
  }
);
