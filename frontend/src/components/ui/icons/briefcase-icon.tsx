import { forwardRef, useImperativeHandle, useCallback } from "react";
import { AnimatedIconProps } from "./types";
import { motion, useAnimate } from "framer-motion";

export type BriefcaseIconHandle = {
    startAnimation: () => void;
    stopAnimation: () => void;
};

const BriefcaseIcon = forwardRef<BriefcaseIconHandle, AnimatedIconProps>(
    (
        { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
        ref,
    ) => {
        const [scope, animate] = useAnimate();

        const start = useCallback(async () => {
            // Animate handle lifting up
            await animate(
                ".briefcase-handle",
                { y: [-2, 0], opacity: [0.6, 1] },
                { duration: 0.3, ease: "easeOut" }
            );

            // Animate lock clicking
            await animate(
                ".briefcase-lock",
                { scale: [0.8, 1.1, 1] },
                { duration: 0.4, ease: "easeInOut" }
            );

            // Subtle body bounce
            animate(
                ".briefcase-body",
                { y: [0, -1, 0] },
                { duration: 0.3, ease: "easeInOut" }
            );
        }, [animate]);

        const stop = useCallback(() => {
            animate(
                ".briefcase-handle, .briefcase-lock, .briefcase-body",
                { y: 0, opacity: 1, scale: 1 },
                { duration: 0.2, ease: "easeInOut" }
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

                {/* Briefcase body */}
                <motion.rect
                    className="briefcase-body"
                    x="3"
                    y="7"
                    width="18"
                    height="13"
                    rx="2"
                    style={{ transformOrigin: "center" }}
                />

                {/* Handle */}
                <motion.path
                    className="briefcase-handle"
                    d="M8 7V5a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2"
                    style={{ transformOrigin: "12px 5px" }}
                />

                {/* Lock/clasp */}
                <motion.line
                    className="briefcase-lock"
                    x1="12"
                    y1="12"
                    x2="12"
                    y2="12.01"
                    style={{ transformOrigin: "12px 12px" }}
                />

                {/* Horizontal divider line */}
                <motion.line
                    className="briefcase-body"
                    x1="3"
                    y1="13"
                    x2="21"
                    y2="13"
                />
            </motion.svg>
        );
    },
);

BriefcaseIcon.displayName = "BriefcaseIcon";
export default BriefcaseIcon;
