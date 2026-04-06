import { useState } from 'react';
import { Send } from 'lucide-react';

export default function CommentInput({ onSubmit, disabled = false, placeholder = "Add a comment..." }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('Comment cannot be empty');
      return;
    }

    if (content.length > 1000) {
      alert('Comment cannot exceed 1000 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent(''); // Clear after successful submission
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = content.length;
  const maxChars = 1000;
  const isNearLimit = charCount > maxChars * 0.8;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          className="
            w-full px-4 py-3 border border-gray-300 rounded-lg
            text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            resize-none
          "
          rows="4"
          maxLength={maxChars}
        />
      </div>

      {/* Character counter and submit button */}
      <div className="flex items-center justify-between">
        <div className="text-xs">
          <span className={isNearLimit ? 'text-orange-600 font-medium' : 'text-gray-500'}>
            {charCount} / {maxChars}
          </span>
          {isNearLimit && <span className="text-orange-600 ml-1">⚠️</span>}
        </div>

        <button
          type="submit"
          disabled={!content.trim() || disabled || isSubmitting}
          className="
            flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium
            text-sm hover:bg-blue-600 transition-colors
            disabled:bg-gray-400 disabled:cursor-not-allowed
          "
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send size={16} />
              Post
            </>
          )}
        </button>
      </div>
    </form>
  );
}
