import { forwardRef, useImperativeHandle, useCallback } from "react";
import { AnimatedIconProps } from "./types";
import { motion, useAnimate } from "motion/react";

const DownloadIcon = forwardRef<any, AnimatedIconProps>(
    ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
        const [scope, animate] = useAnimate();

        const start = useCallback(async () => {
            // Arrow down animation
            await animate(
                ".arrow",
                { y: [0, 5, 0] },
                { duration: 0.5, ease: "easeInOut" }
            );
        }, [animate]);

        useImperativeHandle(ref, () => ({
            startAnimation: start,
            stopAnimation: () => { },
        }));

        return (
            <motion.svg
                ref={scope}
                className={`cursor-pointer ${className}`}
                onHoverStart={start}
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <motion.polyline className="arrow" points="7 10 12 15 17 10" />
                <motion.line className="arrow" x1="12" y1="15" x2="12" y2="3" />
            </motion.svg>
        );
    }
);

DownloadIcon.displayName = "DownloadIcon";
export default DownloadIcon;
