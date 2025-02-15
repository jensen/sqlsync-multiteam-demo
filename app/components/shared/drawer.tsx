import { forwardRef, type PropsWithChildren, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router";

export function useDrawer(open?: boolean) {
  const drawerRef = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (drawerRef.current === null) return;

    const drawer = drawerRef.current;

    const click = (event: MouseEvent) => {
      event.stopPropagation();

      const rect = drawer.children[1].getBoundingClientRect();

      if (
        !(
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        )
      ) {
        if (drawer.open) {
          drawer.close();
        }
      }
    };

    const close = () => {
      if (open !== undefined) {
        setTimeout(() => {
          navigate("..");
        }, 200);
      }
    };

    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
      }
    };

    drawer.addEventListener("keydown", keydown);
    drawer.addEventListener("close", close);
    document.addEventListener("click", click);

    return () => {
      drawer.removeEventListener("keydown", keydown);
      drawer.removeEventListener("close", close);
      document.removeEventListener("click", click);
    };
  }, [navigate, open]);

  return {
    drawerRef,
  };
}

interface DrawerProps extends PropsWithChildren {
  open?: boolean;
}

export const Drawer = forwardRef<HTMLDialogElement, DrawerProps>(
  function Drawer(props, ref) {
    const { open } = props;

    const { drawerRef } = useDrawer(open);

    useEffect(() => {
      const drawer = drawerRef.current;

      if (drawer) {
        if (open) {
          drawer.showModal();
        } else {
          drawer.close();
        }
      }
    }, [open, drawerRef]);

    return createPortal(
      <dialog
        ref={ref ? ref : drawerRef}
        className="drawer fixed left-0 top-0 bottom-0 max-w-full max-h-full m-0 w-full h-full bg-transparent z-50"
      >
        <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden z-20">
          <video
            width="1280"
            height="720"
            autoPlay
            loop
            muted
            playsInline
            className="absolute min-w-[1280px] min-h-[720px] bottom-0 -translate-y-[0px] left-1/2 -translate-x-1/2"
          >
            <source src="/videos/drawer.mp4" type='video/mp4; codecs="hvc1"' />
            <source src="/videos/drawer.webm" type="video/webm" />
          </video>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[644px] h-[571px] z-30 px-8 py-6 space-y-6 flex flex-col text-zinc-300 border border-zinc-900 bg-zinc-950/75 backdrop-blur-md rounded-t-xl drop-shadow-Drawer shadow-button">
          {props.children}
        </div>
      </dialog>,
      document.body
    );
  }
);
