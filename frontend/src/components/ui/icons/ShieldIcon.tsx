
import { forwardRef, useImperativeHandle, useCallback } from "react";
import { AnimatedIconProps } from "./types";
import { motion, useAnimate } from "framer-motion";

export type ShieldIconHandle = {
    startAnimation: () => void;
    stopAnimation: () => void;
};

const ShieldIcon = forwardRef<ShieldIconHandle, AnimatedIconProps>(
    (
        { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
        ref,
    ) => {
        const [scope, animate] = useAnimate();

        const start = useCallback(async () => {
            animate(
                ".shield-body",
                { scale: [1, 1.05, 1] },
                { duration: 0.35, ease: "easeOut" },
            );
        }, [animate]);

        const stop = useCallback(() => {
            animate(".shield-body", { scale: 1 }, { duration: 0.2 });
        }, [animate]);

        useImperativeHandle(ref, () => ({
            startAnimation: start,
            stopAnimation: stop,
        }));

        return (
            <motion.svg
                ref={scope}
                onHoverStart={start}
                onHoverEnd={stop}
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`cursor-pointer ${className}`}
                style={{ overflow: "visible" }}
            >
                <motion.path
                    className="shield-body"
                    style={{ transformOrigin: "50% 50%" }}
                    d="M11.46 20.846a12 12 0 0 1 -7.96 -14.846a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3a12 12 0 0 1 -.09 7.06"
                />
            </motion.svg>
        );
    },
);

ShieldIcon.displayName = "ShieldIcon";
export default ShieldIcon;
