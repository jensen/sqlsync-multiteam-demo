import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from "react";
import { Outlet } from "react-router";

import { clsx } from "clsx";

const AuthAnimationContext = createContext<{
  setAnimate: Dispatch<SetStateAction<"in" | "out" | undefined>>;
}>({
  setAnimate: () => null,
});

export const useAuthAnimation = () => {
  return useContext(AuthAnimationContext);
};

export default function CommonAuth(props: PropsWithChildren) {
  const [animate, setAnimate] = useState<"in" | "out" | undefined>();

  useEffect(() => {
    setAnimate("in");
  }, []);

  return (
    <div
      className={clsx(
        animate === "in" ? "opacity-100" : "opacity-0",
        "h-full grid place-content-center relative transition-opacity duration-300"
      )}
    >
      <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden z-10 flex items-center justify-center">
        <video
          width="1920"
          height="1080"
          autoPlay
          loop
          muted
          playsInline
          className="object-center min-w-[1920px] min-h-[1080px]"
        >
          <source src="/videos/auth.mp4" type='video/mp4; codecs="hvc1"' />
          <source src="/videos/auth.webm" type="video/webm" />
        </video>
      </div>
      <div
        style={{ width: "310px", height: "350px" }}
        className="rounded p-8 bg-zinc-950/75 backdrop-blur-lg backdrop-opacity-50 relative z-20 flex flex-col justify-end"
      >
        <AuthAnimationContext.Provider value={{ setAnimate }}>
          <Outlet />
        </AuthAnimationContext.Provider>
      </div>
    </div>
  );
}
