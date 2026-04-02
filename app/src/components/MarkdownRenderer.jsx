import { createMemo } from 'solid-js';
import { marked } from 'marked';

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: true,
  sanitize: false, // 注意：如果显示用户输入的内容，应该设置为 true 或使用 sanitizer
});

export default function MarkdownRenderer(props) {
  const html = createMemo(() => {
    const content = props.children || '';
    if (!content) return '';

    try {
      return marked.parse(content);
    } catch (error) {
      console.error('Markdown 解析错误:', error);
      return `<div class="text-red-500 p-4 bg-red-50 rounded-lg">Markdown 解析错误: ${error.message}</div>`;
    }
  });

  return (
    <div
      class="markdown-content prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-em:text-gray-300 prose-code:text-gray-300 prose-pre:bg-gray-800 prose-pre:text-gray-300 prose-blockquote:text-gray-400 prose-ul:text-gray-300 prose-ol:text-gray-300 prose-li:text-gray-300 prose-table:text-gray-300 prose-th:text-gray-300 prose-td:text-gray-300 prose-a:text-blue-400 hover:prose-a:text-blue-300"
      innerHTML={html()}
    />
  );
}