import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import FileChip from './FileChip.jsx';

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export default function UploadZone({ pendingFiles, onAddFiles, onRemoveFile, statuses }) {
  const onDrop = useCallback(
    (accepted) => {
      if (accepted.length) onAddFiles(accepted);
    },
    [onAddFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: ACCEPT });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-sm font-medium text-slate-700">
          Drag &amp; drop .docx / .pdf files here, or click to browse
        </p>
        <p className="mt-1 text-xs text-slate-400">You can select multiple files at once</p>
      </div>

      {pendingFiles.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {pendingFiles.map((file, i) => (
            <FileChip
              key={`${file.name}-${i}`}
              file={file}
              status={statuses?.[file.name]?.status}
              error={statuses?.[file.name]?.error}
              onRemove={() => onRemoveFile(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
