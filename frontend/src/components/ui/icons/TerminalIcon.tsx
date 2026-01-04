import { forwardRef, useImperativeHandle } from "react";
import { AnimatedIconProps } from "./types";
import { motion, useAnimate } from "framer-motion";

export type TerminalIconHandle = {
    startAnimation: () => void;
    stopAnimation: () => void;
};

const TerminalIcon = forwardRef<TerminalIconHandle, AnimatedIconProps>(
    (
        { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
        ref,
    ) => {
        const [scope, animate] = useAnimate();

        const start = async () => {
            // Reset
            animate(".terminal-path", { pathLength: 0, opacity: 0 }, { duration: 0 });
            animate(".terminal-line", { pathLength: 0, opacity: 0 }, { duration: 0 });

            // Draw the bracket ">"
            await animate(
                ".terminal-path",
                { pathLength: [0, 1], opacity: [0, 1] },
                { duration: 0.4, ease: "easeInOut" }
            );

            // Draw the underscore "_"
            await animate(
                ".terminal-line",
                { pathLength: [0, 1], opacity: [0, 1] },
                { duration: 0.3, ease: "easeOut" }
            );

            // Slight scale bump
            animate(
                scope.current,
                { scale: [1, 1.05, 1] },
                { duration: 0.3, ease: "easeOut" }
            );
        };

        const stop = () => {
            animate(
                ".terminal-path",
                { pathLength: 1, opacity: 1 },
                { duration: 0.2 }
            );
            animate(
                ".terminal-line",
                { pathLength: 1, opacity: 1 },
                { duration: 0.2 }
            );
            animate(scope.current, { scale: 1 }, { duration: 0.2 });
        };

        useImperativeHandle(ref, () => ({
            startAnimation: start,
            stopAnimation: stop,
        }));

        const handleHoverStart = () => {
            start();
        };

        const handleHoverEnd = () => {
            stop();
        };

        return (
            <motion.svg
                ref={scope}
                onHoverStart={handleHoverStart}
                onHoverEnd={handleHoverEnd}
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
                <motion.polyline
                    className="terminal-path"
                    points="4 17 10 11 4 5"
                    initial={{ pathLength: 1, opacity: 1 }}
                />
                <motion.line
                    className="terminal-line"
                    x1="12"
                    y1="19"
                    x2="20"
                    y2="19"
                    initial={{ pathLength: 1, opacity: 1 }}
                />
            </motion.svg>
        );
    },
);

TerminalIcon.displayName = "TerminalIcon";

export default TerminalIcon;
