import { forwardRef, useImperativeHandle, useCallback } from "react";
import { AnimatedIconProps } from "./types";
import { motion, useAnimate } from "motion/react";

export type ShieldXIconHandle = {
    startAnimation: () => void;
    stopAnimation: () => void;
};

const ShieldXIcon = forwardRef<ShieldXIconHandle, AnimatedIconProps>(
    (
        { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
        ref,
    ) => {
        const [scope, animate] = useAnimate();

        const start = useCallback(async () => {
            // Pulse the shield body
            animate(
                ".shield-body",
                { scale: [1, 1.05, 1] },
                { duration: 0.35, ease: "easeOut" },
            );
            // Rotate the X
            await animate(
                ".x-mark",
                { rotate: 90, scale: 1.1 },
                { duration: 0.3, ease: "easeOut" }
            );
        }, [animate]);

        const stop = useCallback(() => {
            animate(".shield-body", { scale: 1 }, { duration: 0.2 });
            animate(".x-mark", { rotate: 0, scale: 1 }, { duration: 0.2 });
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
                    d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"
                />
                <motion.path
                    className="x-mark"
                    style={{ transformOrigin: "50% 50%" }}
                    d="M10 10l4 4m0 -4l-4 4"
                />
            </motion.svg>
        );
    },
);

ShieldXIcon.displayName = "ShieldXIcon";
export default ShieldXIcon;
