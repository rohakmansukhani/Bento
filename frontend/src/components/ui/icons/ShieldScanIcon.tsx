import { forwardRef, useImperativeHandle } from "react";
import { AnimatedIconProps } from "./types";
import { motion, useAnimate } from "framer-motion";

export type ShieldScanIconHandle = {
    startAnimation: () => void;
    stopAnimation: () => void;
};

const ShieldScanIcon = forwardRef<ShieldScanIconHandle, AnimatedIconProps>(
    (
        { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
        ref,
    ) => {
        const [scope, animate] = useAnimate();

        const start = async () => {
            // 1. Draw Shield
            animate(
                ".shield-path",
                { pathLength: [0, 1], opacity: 1 },
                { duration: 0.5, ease: "easeInOut" }
            );

            // 2. Scan Line moves down
            await animate(
                ".scan-line",
                { y1: [8, 16], y2: [8, 16], opacity: [0, 1, 0] },
                { duration: 1.5, ease: "easeInOut", repeat: 1, repeatType: "mirror" }
            );

            // 3. Pulse shield
            animate(
                ".shield-path",
                { strokeWidth: [2, 3, 2] },
                { duration: 0.5 }
            );
        };

        const stop = () => {
            animate(".shield-path", { pathLength: 1, opacity: 1 }, { duration: 0.2 });
            animate(".scan-line", { opacity: 0 }, { duration: 0.2 });
        };

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
                onHoverStart={() => start()}
                onHoverEnd={() => stop()}
            >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />

                {/* Shield Body */}
                <motion.path
                    className="shield-path"
                    d="M12 3a12 12 0 0 0 8.5 3A12 12 0 0 1 12 21 12 12 0 0 1 3.5 6 12 12 0 0 0 12 3"
                    initial={{ pathLength: 1 }}
                />

                {/* Scan Line (hidden by default) */}
                <motion.line
                    className="scan-line"
                    x1="7"
                    y1="8"
                    x2="17"
                    y2="8"
                    initial={{ opacity: 0 }}
                    strokeDasharray="2 2"
                />
            </motion.svg>
        );
    },
);

ShieldScanIcon.displayName = "ShieldScanIcon";
export default ShieldScanIcon;
