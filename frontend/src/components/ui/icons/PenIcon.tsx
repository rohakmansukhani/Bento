import { forwardRef, useImperativeHandle, useCallback } from "react";
import { AnimatedIconProps } from "./types";
import { motion, useAnimate } from "framer-motion";

export type PenIconHandle = {
    startAnimation: () => void;
    stopAnimation: () => void;
};

const PenIcon = forwardRef<PenIconHandle, AnimatedIconProps>(
    (
        { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
        ref,
    ) => {
        const [scope, animate] = useAnimate();

        const start = useCallback(async () => {
            // Writing Wiggle Animation
            await animate(
                ".pen-group",
                {
                    rotate: [0, -10, 5, -10, 0],
                    x: [0, -2, 2, -2, 0],
                    y: [0, 2, -2, 2, 0],
                },
                { duration: 0.6, ease: "easeInOut", repeat: 1 }
            );
        }, [animate]);

        const stop = useCallback(() => {
            animate(
                ".pen-group",
                { x: 0, y: 0, rotate: 0 },
                { duration: 0.2, ease: "easeInOut" },
            );
        }, [animate]);

        useImperativeHandle(ref, () => ({
            startAnimation: start,
            stopAnimation: stop,
        }));

        return (
            <motion.svg
                ref={scope}
                width={size}
                height={size}
                viewBox="0 0 32 32"
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="square"
                strokeMiterlimit="10"
                className={`cursor-pointer ${className}`}
                style={{ overflow: "visible" }}
                onHoverStart={start}
                onHoverEnd={stop}
            >
                <motion.g
                    className="pen-group"
                    style={{
                        transformOrigin: "50% 50%",
                        transformBox: "fill-box",
                    }}
                >
                    {/* Slash animation (pathLength works now) */}
                    <motion.path
                        className="pen-slash"
                        d="M20 6 L26 12"
                        initial={{ pathLength: 0, opacity: 0 }}
                    />

                    {/* Pen body */}
                    <motion.path
                        className="pen-body"
                        d="m10.5,27.5l-8,2 2-8L22.257,3.743c1.657-1.657,4.343-1.657,6,0s1.657,4.343,0,6L10.5,27.5Z"
                    />
                </motion.g>
            </motion.svg>
        );
    },
);

PenIcon.displayName = "PenIcon";
export default PenIcon;
