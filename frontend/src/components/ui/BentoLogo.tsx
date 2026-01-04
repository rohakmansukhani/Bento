
import { motion, SVGMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface BentoLogoProps extends SVGMotionProps<SVGSVGElement> {
    size?: number;
    className?: string;
    withText?: boolean;
}

export default function BentoLogo({
    size = 32,
    className,
    withText = false,
    ...props
}: BentoLogoProps) {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            <motion.svg
                width={size}
                height={size}
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                initial="initial"
                whileHover="hover"
                {...props}
            >
                {/* Abstract Bento Grid / Shield Metaphor */}
                <motion.rect
                    x="4"
                    y="4"
                    width="10"
                    height="10"
                    rx="3"
                    className="fill-safety_gold"
                    variants={{
                        initial: { opacity: 0.9, scale: 1 },
                        hover: { scale: 0.95 }
                    }}
                />
                <motion.rect
                    x="16"
                    y="4"
                    width="12"
                    height="10"
                    rx="3"
                    className="fill-white/20"
                    variants={{
                        initial: { x: 0 },
                        hover: { x: 2 }
                    }}
                />
                <motion.rect
                    x="4"
                    y="16"
                    width="10"
                    height="12"
                    rx="3"
                    className="fill-white/20"
                    variants={{
                        initial: { y: 0 },
                        hover: { y: 2 }
                    }}
                />
                <motion.rect
                    x="16"
                    y="16"
                    width="12"
                    height="12"
                    rx="3"
                    className="fill-white/80"
                    variants={{
                        initial: { opacity: 1, scale: 1 },
                        hover: { scale: 1.05, opacity: 1 }
                    }}
                />

                {/* Central Safe Dot */}
                <motion.circle
                    cx="22"
                    cy="22"
                    r="2"
                    className="fill-obsidian"
                    variants={{
                        initial: { scale: 0 },
                        hover: { scale: 1 }
                    }}
                />
            </motion.svg>

            {withText && (
                <span className="font-mono text-lg font-bold tracking-tight text-white">
                    BENTO
                </span>
            )}
        </div>
    );
}
