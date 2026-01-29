import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Custom Table Component with Copy Button
const TableWithCopy = ({ children, ...props }) => {
    const [copied, setCopied] = useState(false);
    const tableRef = useRef(null);

    const handleCopy = async () => {
        if (!tableRef.current) return;

        try {
            // Create a blob for the HTML content
            const html = tableRef.current.outerHTML;
            // Simple text conversion
            const text = tableRef.current.innerText;

            const clipboardItem = new ClipboardItem({
                'text/html': new Blob([html], { type: 'text/html' }),
                'text/plain': new Blob([text], { type: 'text/plain' })
            });

            await navigator.clipboard.write([clipboardItem]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy table:', err);
        }
    };

    return (
        <div className="table-wrapper">
            <button
                className="table-copy-btn"
                onClick={handleCopy}
                title="Copy Table"
            >
                {copied ? 'Copied!' : 'Copy Table'}
            </button>
            <table ref={tableRef} {...props}>
                {children}
            </table>
        </div>
    );
};

export default function MarkdownTable({ content }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                table: TableWithCopy
            }}
        >
            {content}
        </ReactMarkdown>
    );
}
