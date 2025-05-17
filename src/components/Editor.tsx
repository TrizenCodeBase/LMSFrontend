import { useTheme } from 'next-themes';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import { Skeleton } from '@/components/ui/skeleton';
import * as React from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
}

export const Editor = React.forwardRef<HTMLDivElement, EditorProps>(({
  value,
  onChange,
  language = 'javascript',
  height = '400px',
  readOnly = false,
}, ref) => {
  const { theme } = useTheme();

  const handleEditorDidMount: OnMount = (editor) => {
    // Add any editor configurations here
    editor.updateOptions({
      minimap: {
        enabled: false,
      },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      readOnly,
      wordWrap: 'on',
      wrappingIndent: 'indent',
      automaticLayout: true,
    });
  };

  return (
    <div ref={ref} className="relative border rounded-md overflow-hidden">
      <MonacoEditor
        height={height}
        language={language}
        value={value}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        onChange={(value) => onChange(value || '')}
        onMount={handleEditorDidMount}
        loading={<Skeleton className="w-full h-full" />}
        options={{
          readOnly,
          scrollBeyondLastLine: false,
          fontSize: 14,
          minimap: {
            enabled: false,
          },
        }}
      />
    </div>
  );
});

Editor.displayName = "Editor"; 