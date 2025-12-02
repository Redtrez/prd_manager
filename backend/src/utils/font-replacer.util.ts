import * as fs from 'fs';
import * as path from 'path';

/**
 * 字体替换工具类
 * 用于处理上传的HTML文件中的Google Fonts引用，替换为本地字体
 */
export class FontReplacer {
    /**
     * 递归处理目录下的所有HTML和CSS文件
     * @param dirPath 目标目录路径
     * @returns 处理的文件数量
     */
    static processDirectory(dirPath: string): number {
        let processedCount = 0;

        try {
            const items = fs.readdirSync(dirPath);

            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    // 跳过特殊目录
                    if (item === '__MACOSX' || item.startsWith('.')) {
                        continue;
                    }
                    // 递归处理子目录
                    processedCount += this.processDirectory(fullPath);
                } else if (stat.isFile()) {
                    // 处理HTML和CSS文件
                    const ext = path.extname(item).toLowerCase();
                    if (ext === '.html' || ext === '.htm' || ext === '.css') {
                        if (this.processFile(fullPath)) {
                            processedCount++;
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`[FontReplacer] Error processing directory ${dirPath}:`, error);
            throw error;
        }

        return processedCount;
    }

    /**
     * 处理单个文件
     * @param filePath 文件路径
     * @returns 是否修改了文件
     */
    private static processFile(filePath: string): boolean {
        try {
            // 读取文件内容
            let content = fs.readFileSync(filePath, 'utf-8');
            const originalContent = content;

            // 执行字体替换
            content = this.replaceGoogleFonts(content);

            // 仅当内容有变化时才写回
            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf-8');
                console.log(`[FontReplacer] Processed: ${filePath}`);
                return true;
            }

            return false;
        } catch (error) {
            // 记录警告但不中断流程
            console.warn(`[FontReplacer] Warning processing file ${filePath}:`, error.message);
            return false;
        }
    }

    /**
     * 执行Google Fonts替换
     * @param content 原始内容
     * @returns 处理后的内容
     */
    private static replaceGoogleFonts(content: string): string {
        const localFontLink = '<link href="/fonts/inter.css" rel="stylesheet">';

        // 0. 检查是否已经存在本地字体链接，如果存在，先移除它以避免重复，
        // 或者我们假设如果存在，可能是之前处理过的。
        // 为了安全起见，我们先不移除，而是确保后续替换不会重复添加。
        const hasLocalFont = content.includes(localFontLink);

        // 1. 移除所有 Google Fonts 的 preconnect
        content = content.replace(/<link\s+rel=["']preconnect["']\s+href=["']https:\/\/fonts\.googleapis\.com["']\s*\/?>/gi, '');
        content = content.replace(/<link\s+rel=["']preconnect["']\s+href=["']https:\/\/fonts\.gstatic\.com["']\s+crossorigin\s*\/?>/gi, '');

        // 2. 替换 Inter 字体 (处理各种可能的格式)
        // 使用更通用的正则来匹配 Inter 字体链接
        const interRegex = /<link\s+[^>]*href=["']https:\/\/fonts\.googleapis\.com\/css2\?family=Inter[^"']*["'][^>]*>/gi;

        let interReplaced = false;
        if (interRegex.test(content)) {
            content = content.replace(interRegex, hasLocalFont ? '' : localFontLink);
            interReplaced = true;
        }

        // 3. 移除其他 Google Fonts (如 Source Sans Pro) 并作为兜底
        content = content.replace(/<link\s+[^>]*href=["']https:\/\/fonts\.googleapis\.com\/[^"']*["'][^>]*>/gi, (match) => {
            // 如果是 Inter 且之前没有被替换过 (可能上面的正则没匹配到)，替换为本地
            if (match.includes('Inter') && !interReplaced && !hasLocalFont) {
                interReplaced = true;
                return localFontLink;
            }
            // 如果是 Inter 但已经替换过或已存在，直接移除
            if (match.includes('Inter')) {
                return '';
            }
            return `<!-- ${match} removed for offline use -->`;
        });

        // 移除之前可能注入的全局样式
        const styleRegex = /<style>\s*\/\* 强制覆盖 Axure 的宽度限制 \*\/[\s\S]*?<\/style>\s*/;
        if (styleRegex.test(content)) {
            content = content.replace(styleRegex, '');
        }

        return content;
    }

    /**
     * 注入全局样式以修复布局问题
     * @param content 原始内容
     * @returns 处理后的内容
     */
    private static injectGlobalStyles(content: string): string {
        const styleTag = `
    <style>
        /* 强制覆盖 Axure 的宽度限制 */
        html, body {
            overflow: visible !important;
            overflow-x: auto !important;
            width: auto !important;
            min-width: 100% !important;
        }
        #base {
            max-width: none !important;
            width: auto !important;
            min-width: 100% !important;
            position: absolute; /* 确保绝对定位正常工作 */
            top: 0;
            left: 0;
            overflow: visible !important;
        }
    </style>
`;
        // 移除旧的样式块（如果存在）
        const oldStyleRegex = /<style>\s*\/\* 强制覆盖 Axure 的宽度限制 \*\/[\s\S]*?<\/style>\s*/;
        if (oldStyleRegex.test(content)) {
            content = content.replace(oldStyleRegex, '');
        }

        // 插入到 </head> 之前
        if (content.includes('</head>')) {
            return content.replace('</head>', `${styleTag}</head>`);
        }
        return content;
    }
}
