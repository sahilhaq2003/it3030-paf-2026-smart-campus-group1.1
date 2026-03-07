import AppLayout from '../../components/AppLayout';
import PageContainer from '../../components/PageContainer';

const STATUS_STEPS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const priorityColors = {
  LOW: 'bg-green-100 text-green-700 border border-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  HIGH: 'bg-orange-100 text-orange-700 border border-orange-300',
  CRITICAL: 'bg-red-100 text-red-700 border border-red-300',
};

const statusColors = {
  OPEN: 'bg-cyan-100 text-cyan-700 border border-cyan-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border border-blue-300',
  RESOLVED: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
  CLOSED: 'bg-slate-100 text-slate-700 border border-slate-300',
  REJECTED: 'bg-red-100 text-red-700 border border-red-300',
};

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [comment, setComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [lightboxImg, setLightboxImg] = useState(null);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketApi.getTicketById(id).then(r => r.data),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => ticketApi.getComments(id).then(r => r.data),
    enabled: !!id,
  });

  const addComment = useMutation({
    mutationFn: () => ticketApi.addComment(id, comment),
    onSuccess: () => {
      qc.invalidateQueries(['comments', id]);
      setComment('');
      toast.success('Comment added');
    },
  });

  const editComment = useMutation({
    mutationFn: ({ cid, content }) => ticketApi.editComment(id, cid, content),
    onSuccess: () => {
      qc.invalidateQueries(['comments', id]);
      setEditingCommentId(null);
      toast.success('Comment updated');
    },
  });

  const deleteComment = useMutation({
    mutationFn: (cid) => ticketApi.deleteComment(id, cid),
    onSuccess: () => {
      qc.invalidateQueries(['comments', id]);
      toast.success('Comment deleted');
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  if (!ticket) return <div className="text-center py-16 text-gray-500">Ticket not found</div>;

  const stepIndex = STATUS_STEPS.indexOf(ticket.status);
  const isRejected = ticket.status === 'REJECTED';

  // Calculate SLA elapsed time
  const hoursElapsed = (Date.now() - new Date(ticket.createdAt)) / (1000 * 60 * 60);
  const slaBreached =
    (ticket.priority === 'CRITICAL' && hoursElapsed > 2 && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') ||
    (ticket.priority === 'HIGH' && hoursElapsed > 8 && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED');

  return (
    <AppLayout>
      <PageContainer>
        {/* ...existing code... */}
      {/* Header */}
        <button onClick={() => navigate(-1)}
          className="flex items-center text-cyan-600 hover:text-cyan-700 mb-6 text-sm font-medium transition-colors">
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Ticket Header */}
          <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[ticket.status]}`}>{ticket.status.replace('_', ' ')}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${priorityColors[ticket.priority]}`}>{ticket.priority}</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">{ticket.category}</span>
                {slaBreached && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-700 text-white animate-pulse shadow-lg">⚠ SLA BREACHED</span>
                )}
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{ticket.title}</h1>
            </div>
            <span className="text-sm text-purple-700 font-bold whitespace-nowrap bg-purple-100 px-3 py-1 rounded-lg">#{ticket.id}</span>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600 font-medium">
            <span className="flex items-center gap-1.5 text-slate-900">
              <User size={14} /> {ticket.reportedByName}
            </span>
            {ticket.location && (
              <span className="flex items-center gap-1.5 text-slate-900">
                <MapPin size={14} /> {ticket.location}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-slate-900">
              <Clock size={14} /> {formatDate(ticket.createdAt)}
            </span>
            {ticket.assignedToName && (
              <span className="flex items-center gap-1.5 text-slate-900">
                <Tag size={14} /> Assigned: {ticket.assignedToName}
              </span>
            )}
          </div>
        </div>

        {/* Status Stepper */}
        {!isRejected && (
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all
                    ${i <= stepIndex ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md' : 'bg-slate-300 text-slate-600'}`}>
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <div className="flex-1 mx-1">
                    <div className={`h-1 rounded transition-colors ${i < stepIndex ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-slate-300'}`} />
                  </div>
                  <span className={`text-xs hidden sm:block font-bold transition-colors ${i <= stepIndex ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isRejected && ticket.rejectionReason && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-300 rounded-xl shadow-sm">
            <p className="text-sm font-bold text-red-700 mb-1">⚠ Rejected</p>
            <p className="text-sm text-red-700 font-medium">{ticket.rejectionReason}</p>
          </div>
        )}

        {/* Body */}
        <div className="p-6">
          <p className="text-slate-900 leading-relaxed font-medium">{ticket.description}</p>

          {ticket.resolutionNotes && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-300 rounded-xl shadow-sm">
              <p className="text-sm font-bold text-emerald-900 mb-1">✓ Resolution Notes</p>
              <p className="text-sm text-emerald-900 font-medium">{ticket.resolutionNotes}</p>
            </div>
          )}

          {/* Attachments */}
          {ticket.attachments?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Attachments ({ticket.attachments.length})</h3>
              <div className="flex gap-3 flex-wrap">
                {ticket.attachments.map(a => (
                  <div
                    key={a.id}
                    onClick={() => setLightboxImg(a.url)}
                    className="cursor-pointer group relative"
                  >
                    <img
                      src={a.url}
                      alt={a.originalName}
                      className="h-28 w-28 object-cover rounded-xl border-2 border-slate-200 group-hover:opacity-80 transition-opacity shadow-sm"
                    />
                    <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="border-t border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Comments ({comments.length})</h3>

          <div className="space-y-4 mb-6">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {c.authorName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900">{c.authorName}</span>
                    <span className="text-xs text-slate-500 font-medium">{formatDate(c.createdAt)}</span>
                    {c.edited && <span className="text-xs text-slate-500 italic font-medium">(edited)</span>}
                  </div>

                  {editingCommentId === c.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => editComment.mutate({ cid: c.id, content: editContent })}
                          className="px-4 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium transition-all"
                        >Save</button>
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="px-4 py-1 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-100 font-medium transition-all"
                        >Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between group">
                      <p className="text-sm text-slate-900 flex-1 font-medium">{c.content}</p>
                      {(c.authorId === user?.id || user?.roles?.includes('ADMIN')) && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          {c.authorId === user?.id && (
                            <button onClick={() => { setEditingCommentId(c.id); setEditContent(c.content); }}
                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                              <Edit2 size={13} />
                            </button>
                          )}
                            <button onClick={() => deleteComment.mutate(c.id)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors">
                              <Trash2 size={13} />
                            </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4 font-medium">No comments yet</p>
            )}
          </div>

          {/* Add comment */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 flex gap-2">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment..."
                rows={1}
                className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 resize-none font-medium"
              />
              <button
                onClick={() => addComment.mutate()}
                disabled={!comment.trim() || addComment.isPending}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-bold shadow-sm"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* Lightbox */}
        {lightboxImg && (
          <div
            onClick={() => setLightboxImg(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <img src={lightboxImg} className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" />
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}