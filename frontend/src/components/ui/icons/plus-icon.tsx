import { forwardRef, useImperativeHandle, useCallback } from "react";
import { AnimatedIconProps } from "./types";
import { motion, useAnimate } from "motion/react";

export type PlusIconHandle = {
    startAnimation: () => void;
    stopAnimation: () => void;
};

const PlusIcon = forwardRef<PlusIconHandle, AnimatedIconProps>(
    (
        { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
        ref,
    ) => {
        const [scope, animate] = useAnimate();

        const start = useCallback(async () => {
            await animate(
                ".plus-group",
                { rotate: 90, scale: 1.1 },
                { duration: 0.3, ease: "easeOut" }
            );
        }, [animate]);

        const stop = useCallback(async () => {
            await animate(
                ".plus-group",
                { rotate: 0, scale: 1 },
                { duration: 0.3, ease: "easeInOut" }
            );
        }, [animate]);

        useImperativeHandle(ref, () => ({
            startAnimation: start,
            stopAnimation: stop,
        }));

        return (
            <motion.svg
                ref={scope}
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
                onHoverStart={start}
                onHoverEnd={stop}
            >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <motion.g className="plus-group" style={{ transformOrigin: "50% 50%" }}>
                    <path d="M12 5l0 14" />
                    <path d="M5 12l14 0" />
                </motion.g>
            </motion.svg>
        );
    },
);

PlusIcon.displayName = "PlusIcon";
export default PlusIcon;
