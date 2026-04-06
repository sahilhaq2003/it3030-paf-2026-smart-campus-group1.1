import { useState } from 'react';
import { Edit2, Trash2, AlertCircle } from 'lucide-react';
import CommentInput from './CommentInput';
import { formatDistanceToNow } from 'date-fns';

export default function CommentThread({
  comments = [],
  currentUserId,
  isAdmin = false,
  onAddComment,
  onDeleteComment,
  onEditComment,
  loading = false,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const handleEdit = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) {
      alert('Comment cannot be empty');
      return;
    }
    try {
      await onEditComment(commentId, editContent);
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const canEditComment = (comment) => currentUserId === comment.authorId;

  const canDeleteComment = (comment) => {
    return currentUserId === comment.authorId || isAdmin;
  };

  return (
    <div className="space-y-4">
      {/* Add Comment Form */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Add Comment</h3>
        <CommentInput onSubmit={onAddComment} disabled={loading} />
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              {/* Comment Header */}
              <div className="flex items-start justify-between mb-2 gap-3">
                <div className="flex min-w-0 flex-1 gap-3">
                  {comment.authorAvatarUrl ? (
                    <img
                      src={comment.authorAvatarUrl}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                      {(comment.authorName || '?')
                        .split(/\s+/)
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="min-w-0">
                  <p className="font-medium text-gray-900">{comment.authorName}</p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    {(comment.edited || comment.isEdited) && ' • edited'}
                  </p>
                  </div>
                </div>
                {canDeleteComment(comment) && (
                  <div className="flex shrink-0 gap-1">
                    {canEditComment(comment) && (
                      <button
                        onClick={() => handleEdit(comment)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit comment"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Delete this comment?')) {
                          onDeleteComment(comment.id);
                        }
                      }}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Comment Body */}
              {editingId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    maxLength={1000}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(comment.id)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
