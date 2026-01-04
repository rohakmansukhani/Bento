import { Highlight, themes } from "prism-react-renderer";
import { motion } from "framer-motion";

interface DiffSnippetProps {
    hit: {
        type: string;
        value: string;
        line_number: number;
        context: {
            before: string[];
            match: string;
            after: string[];
        };
    };
    language?: string;
}

export default function DiffSnippet({ hit, language = "javascript" }: DiffSnippetProps) {
    const { type, value, line_number, context } = hit;

    // Combine context lines
    const allLines = [
        ...context.before,
        context.match,
        ...context.after
    ];

    // Calculate starting line number
    const startLineNum = line_number - context.before.length;

    // Create code string
    const codeString = allLines.join('\n');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-lg border border-white/10 bg-zinc_dark/50 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-amber_neon">
                        {type.toUpperCase()}
                    </span>
                    <span className="text-xs text-zinc-600">•</span>
                    <span className="text-xs text-zinc-500">
                        Line {line_number}
                    </span>
                </div>
                <span className="text-xs font-mono text-zinc-600">
                    {value}
                </span>
            </div>

            {/* Code Snippet with Syntax Highlighting */}
            <Highlight
                theme={themes.nightOwl}
                code={codeString}
                language={language as any}
            >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre className={`${className} p-0 m-0 text-xs overflow-x-auto`} style={style}>
                        {tokens.map((line, i) => {
                            const lineNum = startLineNum + i;
                            const isMatchLine = lineNum === line_number;

                            return (
                                <div
                                    key={i}
                                    {...getLineProps({ line })}
                                    className={`
                                        flex
                                        ${isMatchLine ? 'bg-amber_neon/10 border-l-2 border-amber_neon' : ''}
                                    `}
                                >
                                    {/* Line Number Gutter */}
                                    <span
                                        className={`
                                            inline-block w-12 flex-shrink-0 text-right pr-4 select-none
                                            ${isMatchLine ? 'text-amber_neon font-bold' : 'text-zinc-600'}
                                        `}
                                    >
                                        {lineNum}
                                    </span>

                                    {/* Code Content */}
                                    <span className="flex-1">
                                        {line.map((token, key) => {
                                            const props = getTokenProps({ token });

                                            // Highlight redacted portions in amber
                                            if (isMatchLine && token.content.includes(value)) {
                                                return (
                                                    <span
                                                        key={key}
                                                        {...props}
                                                        className="bg-amber_neon/20 text-amber_neon font-semibold px-1 rounded"
                                                    >
                                                        {token.content}
                                                    </span>
                                                );
                                            }

                                            return <span key={key} {...props} />;
                                        })}
                                    </span>
                                </div>
                            );
                        })}
                    </pre>
                )}
            </Highlight>
        </motion.div>
    );
}
