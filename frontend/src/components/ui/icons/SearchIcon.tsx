import { forwardRef, useImperativeHandle, useCallback } from "react";
import { AnimatedIconProps } from "./types";
import { motion, useAnimate } from "motion/react";

const SearchIcon = forwardRef<any, AnimatedIconProps>(
    ({ size = 24, color = "currentColor", strokeWidth = 2, className = "" }, ref) => {
        const [scope, animate] = useAnimate();

        const start = useCallback(async () => {
            await animate(
                scope.current,
                { scale: [1, 1.1, 1] },
                { duration: 0.4, ease: "easeInOut" }
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
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
            </motion.svg>
        );
    }
);

SearchIcon.displayName = "SearchIcon";
export default SearchIcon;
