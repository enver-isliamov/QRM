import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Calendar, Users, Bell, BellOff, Heart, ExternalLink, Phone, Mail, Check, Edit, Copy, MessageCircle, Send, X, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useMeetingDetail, useMeetings } from '../hooks/useMeetings';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { meeting, participants, loading } = useMeetingDetail(id);
  const { toggleAttend, toggleSubscribe, updateMeeting, isGoing, isSubscribed } = useMeetings(user?.id);
  const [copied, setCopied] = useState(false);
  const [editingFund, setEditingFund] = useState(false);
  const [fundForm, setFundForm] = useState({ fund_current: 0, fund_cloudtips_url: '', fund_instructions: '' });
  
  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<{ id: string, name: string, username: string | null, avatar_url: string | null }[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [showReportModal, setShowReportModal] = useState<{ type: 'comment', id: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchComments = async () => {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('meeting_comments')
        .select(`
          id, meeting_id, author_id, content, created_at, parent_id,
          author:profiles(name, avatar_url, role, username)
        `)
        .eq('meeting_id', id)
        .order('created_at', { ascending: true });
      
      if (data && !error) {
        setComments(data);
      }
      setLoadingComments(false);
    };
    fetchComments();

    // Real-time subscription
    const channel = supabase
      .channel(`meeting_comments_${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'meeting_comments',
        filter: `meeting_id=eq.${id}`
      }, async (payload) => {
        // Fetch full comment with author details
        const { data, error } = await supabase
          .from('meeting_comments')
          .select(`
            id, meeting_id, author_id, content, created_at, parent_id,
            author:profiles(name, avatar_url, role, username)
          `)
          .eq('id', payload.new.id)
          .single();
        
        if (data && !error) {
          setComments(prev => {
            if (prev.some(c => c.id === data.id)) return prev;
            return [...prev, data];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (!mentionSearch || mentionSearch.length < 2) {
      setMentionSuggestions([]);
      setShowMentions(false);
      return;
    }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .or(`username.ilike.%${mentionSearch}%,name.ilike.%${mentionSearch}%`)
        .limit(5);
      
      if (data) {
        setMentionSuggestions(data);
        setShowMentions(data.length > 0);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [mentionSearch]);

  const handleCommentChange = (val: string) => {
    setNewComment(val);
    
    // Detect @mention
    const cursorPosition = (document.activeElement as HTMLTextAreaElement)?.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const query = textBeforeCursor.slice(lastAtSymbol + 1);
      // Only trigger if there's no space between @ and cursor
      if (!query.includes(' ')) {
        setMentionSearch(query);
        return;
      }
    }
    
    setMentionSearch('');
    setShowMentions(false);
  };

  const insertMention = (user: { username: string | null, name: string }) => {
    const cursorPosition = (document.activeElement as HTMLTextAreaElement)?.selectionStart || 0;
    const textBeforeCursor = newComment.slice(0, cursorPosition);
    const textAfterCursor = newComment.slice(cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    const username = user.username || user.name.replace(/\s+/g, '_').toLowerCase();
    const newText = textBeforeCursor.slice(0, lastAtSymbol) + `@${username} ` + textAfterCursor;
    
    setNewComment(newText);
    setMentionSearch('');
    setShowMentions(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !id) return;
    const { data, error } = await supabase
      .from('meeting_comments')
      .insert({
        meeting_id: id,
        author_id: user.id,
        content: newComment.trim(),
        parent_id: replyTo
      })
      .select(`
        id, meeting_id, author_id, content, created_at, parent_id,
        author:profiles(name, avatar_url, role, username)
      `)
      .single();
    
    if (data && !error) {
      setComments(prev => [...prev, data]);
      setNewComment('');
      setReplyTo(null);
      
      // Notify organizer if not a reply and not the organizer themselves
      if (!replyTo && meeting && meeting.author_id !== user.id) {
        await supabase.from('user_notifications').insert({
          user_id: meeting.author_id,
          type: 'meeting_update',
          title: 'Новый комментарий к встрече',
          body: `В обсуждении встречи "${meeting.village}" появился новый комментарий`,
          link: `/meetings/${id}`
        });
      }

      // If it's a reply, notify the parent comment author
      if (replyTo) {
        const parentComment = comments.find(c => c.id === replyTo);
        if (parentComment && parentComment.author_id !== user.id) {
          await supabase.from('user_notifications').insert({
            user_id: parentComment.author_id,
            type: 'system',
            title: 'Новый ответ на ваш комментарий',
            body: `Вам ответили в обсуждении встречи "${meeting?.village}"`,
            link: `/meetings/${id}`
          });
        }
      }
    }
  };

  const handleReport = async () => {
    if (!showReportModal || !user || !reportReason.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: showReportModal.type,
      target_id: showReportModal.id,
      reason: reportReason.trim(),
      status: 'pending'
    });
    setSubmitting(false);
    if (!error) {
      toast.success('Жалоба отправлена');
      setShowReportModal(null);
      setReportReason('');
    }
  };

  const going = id ? isGoing(id) : false;
  const subscribed = id ? isSubscribed(id) : false;
  const isOrganizer = user && meeting && meeting.author_id === user.id;
  const isAdmin = profile?.role === 'admin';
  const canEdit = isOrganizer || isAdmin;

  const handleCopyFundLink = () => {
    if (!meeting?.fund_cloudtips_url) return;
    navigator.clipboard.writeText(meeting.fund_cloudtips_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getGoogleCalendarUrl = () => {
    if (!meeting) return '';
    const start = new Date(meeting.meeting_date);
    if (meeting.meeting_time) {
      const [h, m] = (meeting.meeting_time as string).split(':');
      start.setHours(+h, +m);
    }
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2 hours
    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meeting.village)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(meeting.description || '')}&location=${encodeURIComponent(meeting.location || '')}`;
  };

  const handleSaveFund = async () => {
    if (!id) return;
    await updateMeeting(id, {
      fund_current: fundForm.fund_current,
      fund_cloudtips_url: fundForm.fund_cloudtips_url || undefined,
      fund_instructions: fundForm.fund_instructions || undefined,
    });
    setEditingFund(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-100" />)}
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">Встреча не найдена</h2>
          <button onClick={() => navigate('/village-meetings')} className="text-emerald-600 font-medium">← К списку встреч</button>
        </div>
      </div>
    );
  }

  const progress = meeting.fund_progress ?? (meeting.fund_goal && meeting.fund_current != null
    ? Math.round((meeting.fund_current / meeting.fund_goal) * 100) : null);

  const daysUntil = () => {
    if (!meeting) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mDate = new Date(meeting.meeting_date);
    mDate.setHours(0, 0, 0, 0);
    const diff = mDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };
  const days = daysUntil();

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <button onClick={() => navigate('/village-meetings')} className="flex items-center gap-2 text-gray-600 mb-2">
          <ChevronLeft className="w-5 h-5" /><span>Назад</span>
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{meeting.village}</h1>
            <p className="text-sm text-gray-500">Организатор: {meeting.organizer}</p>
            {days !== null && days > 0 && (
              <div className="mt-2 inline-block bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-100">
                До встречи {days} {days === 1 ? 'день' : (days > 1 && days < 5) ? 'дня' : 'дней'}
              </div>
            )}
            {days === 0 && (
              <div className="mt-2 inline-block bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-rose-100 animate-pulse">
                Встреча сегодня!
              </div>
            )}
          </div>
          {canEdit && (
            <button onClick={() => navigate(`/meetings/${id}/edit`)}
              className="flex items-center gap-1 text-sm text-emerald-600 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50">
              <Edit className="w-4 h-4" /><span>Изменить</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* Date & Location */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {format(new Date(meeting.meeting_date), 'd MMMM yyyy', { locale: ru })}
                {meeting.meeting_time && <span className="text-emerald-600 ml-2">в {(meeting.meeting_time as string).slice(0,5)}</span>}
              </p>
              {!meeting.meeting_time && <p className="text-sm text-amber-600">Точное время уточняется</p>}
              <a 
                href={getGoogleCalendarUrl()} 
                target="_blank" 
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:underline"
              >
                <Calendar className="w-3 h-3" />
                Добавить в Google Календарь
              </a>
            </div>
          </div>
          {meeting.location && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-rose-500" />
              </div>
              <div className="flex-1">
                <p className="text-gray-700 font-medium">{meeting.location}</p>
                <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 h-[180px] relative bg-gray-100">
                  <iframe 
                    src={`https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(meeting.location)}&z=14`}
                    width="100%" 
                    height="100%" 
                    frameBorder="0"
                    allowFullScreen={true}
                    className="absolute inset-0"
                  ></iframe>
                </div>
                <a
                  href={`https://yandex.ru/maps/?text=${encodeURIComponent(meeting.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 text-sm font-medium mt-3 inline-flex items-center gap-1 hover:underline"
                >
                  Открыть в Яндекс Картах
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {meeting.description && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">О встрече</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{meeting.description}</p>
          </div>
        )}

        {/* Organizer contacts */}
        {(meeting.organizer_phone || meeting.organizer_email) && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3">Контакты организатора</h3>
            {meeting.organizer_phone && (
              <a href={`tel:${meeting.organizer_phone}`}
                className="flex items-center gap-3 py-2 text-emerald-700 hover:underline">
                <Phone className="w-4 h-4" /><span>{meeting.organizer_phone}</span>
              </a>
            )}
            {meeting.organizer_email && (
              <a href={`mailto:${meeting.organizer_email}`}
                className="flex items-center gap-3 py-2 text-emerald-700 hover:underline">
                <Mail className="w-4 h-4" /><span>{meeting.organizer_email}</span>
              </a>
            )}
          </div>
        )}

        {/* Fund Collection */}
        {(meeting.fund_goal || canEdit) && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                {meeting.fund_purpose || 'Сбор средств'}
              </h3>
              {canEdit && (
                <button onClick={() => {
                  setFundForm({ fund_current: meeting.fund_current ?? 0, fund_cloudtips_url: meeting.fund_cloudtips_url ?? '', fund_instructions: meeting.fund_instructions ?? '' });
                  setEditingFund(true);
                }} className="text-sm text-emerald-600 hover:underline">Обновить</button>
              )}
            </div>

            {meeting.fund_goal && (
              <>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Собрано {meeting.fund_current?.toLocaleString('ru') ?? 0} из {meeting.fund_goal?.toLocaleString('ru')} ₽</span>
                  <span className="font-bold text-emerald-600">{progress ?? 0}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(progress ?? 0, 100)}%` }} />
                </div>
              </>
            )}

            {meeting.fund_instructions && (
              <p className="text-sm text-gray-600 mb-3 bg-emerald-50 rounded-lg p-3">{meeting.fund_instructions}</p>
            )}

            {meeting.fund_cloudtips_url ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input readOnly value={meeting.fund_cloudtips_url}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
                  <button onClick={handleCopyFundLink} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
                <a href={meeting.fund_cloudtips_url} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors">
                  <Heart className="w-4 h-4" />
                  Внести вклад
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : canEdit ? (
              <p className="text-sm text-gray-400 text-center py-2">Добавьте ссылку на сбор средств (CloudTips)</p>
            ) : null}
          </div>
        )}

        {/* Participants */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-800">
              Участники ({meeting.attendees_count ?? 0})
              {(meeting as any).subscribers_count > 0 && (
                <span className="text-sm text-gray-400 ml-2">· {(meeting as any).subscribers_count} подписчиков</span>
              )}
            </h3>
          </div>
          {participants.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1">
                  {p.avatar_url
                    ? <img src={p.avatar_url} className="w-5 h-5 rounded-full object-cover" alt="" />
                    : <div className="w-5 h-5 bg-emerald-200 rounded-full flex items-center justify-center text-xs text-emerald-700">{p.name?.[0]?.toUpperCase()}</div>
                  }
                  <span className="text-sm text-gray-700">{p.name}</span>
                </div>
              ))}
              {(meeting.attendees_count ?? 0) > 20 && (
                <span className="text-sm text-gray-400 self-center">+{(meeting.attendees_count ?? 0) - 20} ещё</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Пока никто не отметился. Будь первым!</p>
          )}
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-800">Обсуждение</h3>
            </div>
            <span className="text-xs text-gray-400">{comments.length} сообщений</span>
          </div>

          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto bg-gray-50/50">
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-6">
                <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Нет комментариев</p>
                <p className="text-xs text-gray-400">Будьте первым, кто начнет обсуждение!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.filter(c => !c.parent_id).map(comment => (
                  <div key={comment.id} className="space-y-3">
                    <div className={`flex gap-3 ${comment.author_id === user?.id ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {comment.author?.avatar_url ? (
                          <img src={comment.author.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-emerald-700 font-medium text-sm">{(comment.author?.name || 'U')[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-1.5 relative group ${
                        comment.author_id === user?.id 
                          ? 'bg-emerald-500 text-white rounded-tr-sm' 
                          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                      }`}>
                        <div className="flex items-center justify-between mb-0.5 gap-4">
                          <span className={`text-[10px] font-bold truncate ${comment.author_id === user?.id ? 'text-emerald-100' : 'text-emerald-600'}`}>
                            {comment.author?.name}
                            {comment.author?.username && <span className="ml-1 font-normal opacity-70">@{comment.author.username}</span>}
                          </span>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setReplyTo(comment.id);
                                setNewComment(`@${comment.author?.username || comment.author?.name}, `);
                              }}
                              className={`text-[9px] font-medium hover:underline ${comment.author_id === user?.id ? 'text-emerald-100' : 'text-emerald-500'}`}
                            >
                              Ответить
                            </button>
                            {comment.author_id !== user?.id && (
                              <button onClick={() => setShowReportModal({ type: 'comment', id: comment.id })} className="text-gray-300 hover:text-rose-500">
                                <Flag className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {comment.content.split(/(@[a-zA-Z0-9_]+)/g).map((part, i) => 
                            part.startsWith('@') ? (
                              <button 
                                key={i} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const username = part.slice(1);
                                  // Find user by username and navigate
                                  supabase.from('profiles').select('id').eq('username', username).single()
                                    .then(({ data }) => {
                                      if (data) navigate(`/user/${data.id}`);
                                    });
                                }}
                                className="font-bold text-blue-400 hover:underline"
                              >
                                {part}
                              </button>
                            ) : part
                          )}
                        </p>
                        <p className={`text-[9px] mt-0.5 text-right ${comment.author_id === user?.id ? 'text-emerald-100' : 'text-gray-400'}`}>
                          {format(new Date(comment.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>

                    {/* Replies */}
                    {comments.filter(r => r.parent_id === comment.id).map(reply => (
                      <div key={reply.id} className={`flex gap-2 ml-8 ${reply.author_id === user?.id ? 'flex-row-reverse' : ''}`}>
                        <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {reply.author?.avatar_url ? (
                            <img src={reply.author.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-emerald-700 font-medium text-[10px]">{(reply.author?.name || 'U')[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-1.5 relative group ${
                          reply.author_id === user?.id 
                            ? 'bg-emerald-400 text-white rounded-tr-sm' 
                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                        }`}>
                          {/* Quote original message */}
                          <div className={`mb-1 pl-2 border-l-2 text-[10px] py-0.5 rounded-r bg-black/5 ${
                            reply.author_id === user?.id ? 'border-emerald-200 text-emerald-50' : 'border-emerald-400 text-gray-500'
                          }`}>
                            <p className="font-bold truncate">{comment.author?.name}</p>
                            <p className="truncate opacity-80">{comment.content}</p>
                          </div>
                          
                          <div className="flex items-center justify-between mb-0.5 gap-3">
                            <span className={`text-[9px] font-bold truncate ${reply.author_id === user?.id ? 'text-emerald-50' : 'text-emerald-600'}`}>
                              {reply.author?.name}
                              {reply.author?.username && <span className="ml-1 font-normal opacity-70">@{reply.author.username}</span>}
                            </span>
                          </div>
                          <p className="text-xs whitespace-pre-wrap break-words">
                            {reply.content.split(/(@[a-zA-Z0-9_]+)/g).map((part, i) => 
                              part.startsWith('@') ? (
                                <button 
                                  key={i} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const username = part.slice(1);
                                    supabase.from('profiles').select('id').eq('username', username).single()
                                      .then(({ data }) => {
                                        if (data) navigate(`/user/${data.id}`);
                                      });
                                  }}
                                  className="font-bold text-blue-300 hover:underline"
                                >
                                  {part}
                                </button>
                              ) : part
                            )}
                          </p>
                          <p className={`text-[8px] mt-0.5 text-right ${reply.author_id === user?.id ? 'text-emerald-50' : 'text-gray-400'}`}>
                            {format(new Date(reply.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-100">
            {user ? (
              <div className="space-y-2 relative">
                {showMentions && mentionSuggestions.length > 0 && (
                  <div className="absolute bottom-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl mb-2 overflow-hidden z-[120]">
                    {mentionSuggestions.map((s, idx) => (
                      <button
                        key={s.id}
                        onClick={() => insertMention(s)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 transition-colors text-left ${idx === mentionIndex ? 'bg-emerald-50' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {s.avatar_url ? (
                            <img src={s.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-emerald-700 text-xs font-bold">{s.name[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{s.name}</p>
                          {s.username && <p className="text-xs text-gray-500">@{s.username}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {replyTo && (
                  <div className="flex items-center justify-between bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                    <p className="text-[10px] text-gray-500">
                      Ответ пользователю <span className="font-bold text-emerald-600">{comments.find(c => c.id === replyTo)?.author?.name}</span>
                    </p>
                    <button onClick={() => { setReplyTo(null); setNewComment(''); }} className="text-gray-400 hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    value={newComment}
                    onChange={e => handleCommentChange(e.target.value)}
                    placeholder="Написать комментарий..."
                    className="flex-1 max-h-24 min-h-[40px] bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
                    rows={1}
                    onKeyDown={e => {
                      if (showMentions && mentionSuggestions.length > 0) {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setMentionIndex(prev => (prev + 1) % mentionSuggestions.length);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setMentionIndex(prev => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length);
                        } else if (e.key === 'Enter' || e.key === 'Tab') {
                          e.preventDefault();
                          if (mentionIndex >= 0) {
                            insertMention(mentionSuggestions[mentionIndex]);
                          } else {
                            insertMention(mentionSuggestions[0]);
                          }
                        } else if (e.key === 'Escape') {
                          setShowMentions(false);
                        }
                      } else if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  <button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="w-10 h-10 flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 py-2">Войдите, чтобы оставить комментарий</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
        <div className="max-w-md mx-auto flex gap-3">
          {user && (
            <button onClick={() => id && toggleSubscribe(id)}
              className={`p-3 rounded-xl border transition-colors ${
                subscribed ? 'bg-amber-50 border-amber-300 text-amber-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
              title={subscribed ? 'Отписаться от уведомлений' : 'Получать уведомления'}>
              {subscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={() => user ? (id && toggleAttend(id)) : navigate('/login')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
              going ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}>
            {going ? <><Check className="w-4 h-4" /> Вы идёте</> : 'Я ПОЕДУ'}
          </button>
        </div>
      </div>

      {/* Edit fund modal */}
      {editingFund && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setEditingFund(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Обновить сбор средств</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Собрано (₽)</label>
                <input type="number" value={fundForm.fund_current}
                  onChange={e => setFundForm(f => ({ ...f, fund_current: +e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка CloudTips</label>
                <input type="url" value={fundForm.fund_cloudtips_url} placeholder="https://pay.cloudtips.ru/p/..."
                  onChange={e => setFundForm(f => ({ ...f, fund_cloudtips_url: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Инструкция для участников</label>
                <textarea value={fundForm.fund_instructions} rows={3}
                  onChange={e => setFundForm(f => ({ ...f, fund_instructions: e.target.value }))}
                  placeholder="Как перевести деньги и для чего они нужны..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingFund(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">Отмена</button>
                <button onClick={handleSaveFund} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600">Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setShowReportModal(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Пожаловаться</h2>
              <button onClick={() => setShowReportModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="Опишите причину жалобы..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent mb-4 resize-none h-32"
            />
            <button
              onClick={handleReport}
              disabled={submitting || !reportReason.trim()}
              className="w-full bg-rose-500 text-white font-semibold py-3 rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Отправка...' : 'Отправить жалобу'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeetingDetail;
