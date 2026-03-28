import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export default function ImageUploadZone({ maxFiles = 3, maxFileSize = 5, onFilesChange }) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
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

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter(validateFile);
    
    if (files.length + validFiles.length > maxFiles) {
      alert(`You can upload a maximum of ${maxFiles} files.`);
      return;
    }

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  return (
    <div className="w-full">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
          ${dragActive
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
        />

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

      {/* File Previews */}
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Attached Images ({files.length}/{maxFiles})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-100"
              >
                {/* Preview */}
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover"
                />

                {/* Overlay info */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                  <p className="text-xs text-white font-medium text-center px-1 truncate">
                    {file.name}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove file"
                >
                  <X size={14} />
                </button>

                {/* File info */}
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
