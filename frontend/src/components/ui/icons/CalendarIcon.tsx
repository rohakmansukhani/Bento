import { forwardRef, useImperativeHandle, useCallback } from "react";
import { AnimatedIconProps } from "./types";
import { motion, useAnimate } from "motion/react";

const CalendarIcon = forwardRef<any, AnimatedIconProps>(
    ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
        const [scope, animate] = useAnimate();

        const start = useCallback(async () => {
            // Wiggle effect
            await animate(
                scope.current,
                { rotate: [0, -10, 10, -5, 5, 0] },
                { duration: 0.5, ease: "easeInOut" }
            );
        }, [animate, scope]);

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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </motion.svg>
        );
    }
);

CalendarIcon.displayName = "CalendarIcon";
export default CalendarIcon;
