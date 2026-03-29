import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const ACCEPT = {
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

export default function ImageUploadZone({ maxFiles = 3, maxFileSize = 5, onFilesChange }) {
  const [files, setFiles] = useState([]);
  const maxSizeBytes = maxFileSize * 1024 * 1024;

  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert(`Invalid file type: ${file.type}. Only JPEG, PNG, and WebP allowed.`);
      return false;
    }
    if (file.size > maxSizeBytes) {
      alert(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds ${maxFileSize}MB limit.`);
      return false;
    }
    return true;
  };

  const onDrop = useCallback(
    (acceptedFiles) => {
      const valid = acceptedFiles.filter(validateFile);
      if (valid.length === 0) return;
      setFiles((prev) => {
        if (prev.length + valid.length > maxFiles) {
          alert(`You can upload a maximum of ${maxFiles} files.`);
          return prev;
        }
        const next = [...prev, ...valid].slice(0, maxFiles);
        onFilesChange(next);
        return next;
      });
    },
    [maxFiles, maxSizeBytes, onFilesChange]
  );

  const onDropRejected = useCallback((fileRejections) => {
    if (!fileRejections?.length) return;
    const first = fileRejections[0];
    const err = first.errors?.[0];
    if (err?.code === 'file-too-large') {
      alert(`File exceeds ${maxFileSize}MB limit.`);
    } else if (err?.code === 'file-invalid-type') {
      alert('Only JPEG, PNG, and WebP images are allowed.');
    }
  }, [maxFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPT,
    maxSize: maxSizeBytes,
    disabled: files.length >= maxFiles,
  });

  const removeFile = (index) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      onFilesChange(next);
      return next;
    });
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
          ${files.length >= maxFiles ? 'cursor-not-allowed opacity-60' : ''}
          ${isDragActive
            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="pointer-events-none">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-900">Drag images here or click to upload</p>
          <p className="text-xs text-gray-500 mt-1">
            JPEG, PNG, WebP • Max {maxFileSize}MB per file • Max {maxFiles} files
          </p>
          {files.length > 0 && (
            <p className="text-xs text-blue-600 mt-2">
              {files.length} of {maxFiles} files selected
            </p>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ImageIcon size={16} className="text-gray-500" />
            Attached Images ({files.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-100"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                  <p className="text-xs text-white font-medium text-center px-1 truncate max-w-full">
                    {file.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove file"
                >
                  <X size={14} />
                </button>
                <div className="px-2 py-1 text-xs text-gray-600">
                  {(file.size / 1024).toFixed(0)}KB
                </div>
              </div>
            ))}
          </div>
          {files.length >= maxFiles && (
            <p className="text-sm text-amber-600 mt-3">
              Maximum number of files reached. Remove files to add more.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
