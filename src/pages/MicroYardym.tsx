import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans, TFunction } from 'react-i18next';
import {
  Heart, Phone, MapPin, AlertCircle, Plus, X,
  Droplets, Banknote, HelpCircle, MessageCircle,
  Send, Check, Flag, Search, Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useHelpRequests } from '../hooks/useHelpRequests';
import { useAuth } from '../hooks/useAuth';
import { HelpRequestRow, HelpRequestCommentRow, supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { Skeleton } from '../components/ui/Skeleton';
import SectionTabs from '../components/SectionTabs';

// ─── ТИПЫ ─────────────────────────────────────────────────────────────────────

type NewReq = {
  type: 'blood' | 'money' | 'other';
  urgency: 'urgent' | 'normal';
  title: string;
  location: string;
  description: string;
  contact_phone: string;
  cloudtips_url?: string;
};

interface RequestCardProps {
  request: HelpRequestRow;
  isUrgent?: boolean;
  isAuthor: boolean;
  hasResponded: boolean;
  isLoggedIn: boolean;
  t: TFunction;
  onRespond:       (id: string) => void;
  onClose:         (id: string) => void;
  onEdit:          (request: HelpRequestRow) => void;
  onOpenComments:  (request: HelpRequestRow) => void;
  onReport:        (type: 'help_request' | 'comment', id: string) => void;
  onNavigate:      (path: string) => void;
}

// ─── ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ИКОНКИ ──────────────────────────────────────────

function getTypeIcon(type: string) {
  switch (type) {
    case 'blood': return <Droplets className="w-5 h-5" />;
    case 'money': return <Banknote className="w-5 h-5" />;
    default:      return <HelpCircle className="w-5 h-5" />;
  }
}

// ─── REQUEST CARD (УРОВЕНЬ МОДУЛЯ — REACT.MEMO РАБОТАЕТ КОРРЕКТНО) ───────────
// Вынесено из компонента MicroYardym, чтобы React.memo мог сравнивать пропсы.
// Без этого компонент пересоздавался бы при каждом рендере родителя.

const RequestCard = memo(function RequestCard({
  request,
  isUrgent,
  isAuthor,
  hasResponded,
  isLoggedIn,
  t,
  onRespond,
  onClose,
  onEdit,
  onOpenComments,
  onReport,
}: RequestCardProps) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        isUrgent ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100 shadow-sm'
      }`}
    >
      {/* Шапка карточки */}
      <div className="flex items-start justify-between mb-2">
        {isUrgent ? (
          <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {request.title}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
              {getTypeIcon(request.type)}
            </div>
            <span className="font-medium text-gray-800">{request.title}</span>
          </div>
        )}
        <span className="text-xs text-gray-400">
          {format(new Date(request.created_at), 'dd.MM HH:mm')}
        </span>
      </div>

      {/* Локация + описание */}
      <div className="flex items-center gap-1 text-gray-600 mb-1">
        <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
        <span className="text-sm">{request.location}</span>
      </div>
      <p className="text-sm text-gray-600 mb-3">{request.description}</p>

      {/* Телефон */}
      {request.contact_phone && (
        <a
          href={`tel:${request.contact_phone}`}
          className="flex items-center gap-1 text-emerald-700 mb-1 text-sm hover:underline"
        >
          <Phone className="w-4 h-4" />
          {request.contact_phone}
        </a>
      )}

      {/* CloudTips */}
      {request.cloudtips_url && (
        <a
          href={request.cloudtips_url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-blue-600 mb-3 text-sm hover:underline"
        >
          <Banknote className="w-4 h-4" />
          {t('yardym.financial_help')}
        </a>
      )}

      {/* Счётчик + кнопки (только для обычных) */}
      {!isUrgent && (
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-400">
            {t('yardym.responses_count', { count: request.responses_count ?? 0 })}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReport('help_request', request.id)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-rose-500 transition-colors"
            >
              <Flag className="w-3 h-3" />
            </button>
            <button
              onClick={() => onOpenComments(request)}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {t('yardym.discussion')}
            </button>
          </div>
        </div>
      )}

      {/* CTA-кнопки */}
      <div className="flex gap-2">
        {isAuthor ? (
          <div className="flex gap-2 w-full">
            <button
              onClick={() => onEdit(request)}
              className="flex-1 font-semibold py-3 rounded-lg transition-colors bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            >
              {t('yardym.edit')}
            </button>
            <button
              onClick={() => onClose(request.id)}
              className="flex-1 font-semibold py-3 rounded-lg transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              {t('yardym.close')}
            </button>
          </div>
        ) : isLoggedIn ? (
          <button
            onClick={() => !hasResponded && onRespond(request.id)}
            disabled={hasResponded}
            className={`w-full font-semibold py-3 rounded-lg transition-colors ${
              hasResponded
                ? 'bg-gray-100 text-gray-400 cursor-default'
                : isUrgent
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {hasResponded
              ? t('yardym.responded')
              : isUrgent
              ? t('yardym.i_can_help')
              : t('yardym.respond')}
          </button>
        ) : (
          <button
            disabled
            className="w-full bg-gray-100 text-gray-400 font-semibold py-3 rounded-lg text-sm"
          >
            {t('yardym.login_to_respond')}
          </button>
        )}

        {/* Дополнительные кнопки для urgent */}
        {isUrgent && (
          <div className="flex gap-2">
            <button
              onClick={() => onReport('help_request', request.id)}
              className="flex items-center justify-center w-12 bg-gray-50 text-gray-400 rounded-lg hover:bg-rose-50 hover:text-rose-500 transition-colors"
            >
              <Flag className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenComments(request)}
              className="flex items-center justify-center w-12 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}, (prev, next) => {
  // Кастомная функция сравнения — перерендер только при изменении данных
  return (
    prev.request.id          === next.request.id &&
    prev.request.title        === next.request.title &&
    prev.request.description  === next.request.description &&
    prev.request.status       === next.request.status &&
    prev.request.responses_count === next.request.responses_count &&
    prev.hasResponded         === next.hasResponded &&
    prev.isAuthor             === next.isAuthor &&
    prev.isLoggedIn           === next.isLoggedIn &&
    prev.isUrgent             === next.isUrgent
  );
});

// ─── ОСНОВНОЙ КОМПОНЕНТ ───────────────────────────────────────────────────────

function MicroYardym() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { featureToggles } = useStore();
  const { requests, loading, addRequest, respond, closeRequest, updateRequest } = useHelpRequests();

  const [searchQuery, setSearchQuery]     = useState('');
  const [filterType, setFilterType]       = useState<string>('all');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');

  // ─── ФИЛЬТРАЦИЯ (useMemo) ────────────────────────────────────────────────────
  const filteredRequests = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return requests.filter(r => {
      const matchesSearch =
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q);
      const matchesType    = filterType    === 'all' || r.type    === filterType;
      const matchesUrgency = filterUrgency === 'all' || r.urgency === filterUrgency;
      return matchesSearch && matchesType && matchesUrgency;
    });
  }, [requests, searchQuery, filterType, filterUrgency]);

  const urgent = useMemo(() => filteredRequests.filter(r => r.urgency === 'urgent'), [filteredRequests]);
  const normal = useMemo(() => filteredRequests.filter(r => r.urgency === 'normal'),  [filteredRequests]);

  // ─── МОДАЛЬНОЕ СОСТОЯНИЕ ─────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal]           = useState(false);
  const [showSuccessModal, setShowSuccessModal]   = useState(false);
  const [editingId, setEditingId]                 = useState<string | null>(null);
  const [showResponseModal, setShowResponseModal] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal]       = useState<string | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState<HelpRequestRow | null>(null);
  const [showReportModal, setShowReportModal]     = useState<{ type: 'help_request' | 'comment'; id: string } | null>(null);
  const [reportReason, setReportReason]           = useState('');

  const [newReq, setNewReq] = useState<NewReq>({
    type: 'other', urgency: 'normal',
    title: '', location: '', description: '', contact_phone: '', cloudtips_url: '',
  });

  // ─── КОММЕНТАРИИ ──────────────────────────────────────────────────────────────
  const [comments, setComments]           = useState<(HelpRequestCommentRow & {
    author: { name: string; avatar_url: string; role: string; username: string | null };
  })[]>([]);
  const [newComment, setNewComment]       = useState('');
  const [replyTo, setReplyTo]             = useState<string | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<{
    id: string; name: string; username: string | null; avatar_url: string | null;
  }[]>([]);
  const [showMentions, setShowMentions]   = useState(false);
  const [mentionIndex, setMentionIndex]   = useState(-1);

  // IDs обращений, на которые пользователь уже откликнулся
  const [alreadyResponded, setAlreadyResponded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setAlreadyResponded(new Set()); return; }
    supabase.from('help_responses')
      .select('request_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setAlreadyResponded(new Set(data.map(r => r.request_id)));
      });
  }, [user]);

  // Загрузка комментариев + realtime
  useEffect(() => {
    if (!showCommentsModal) { setComments([]); return; }
    const fetchComments = async () => {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('help_request_comments')
        .select(`
          id, request_id, author_id, content, created_at, parent_id,
          author:profiles!help_request_comments_author_id_fkey(name, avatar_url, role, username)
        `)
        .eq('request_id', showCommentsModal.id)
        .order('created_at', { ascending: true });
      if (data && !error) setComments(data as any);
      setLoadingComments(false);
    };
    fetchComments();

    const channel = supabase.channel(`help_comments_${showCommentsModal.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'help_request_comments',
        filter: `request_id=eq.${showCommentsModal.id}`,
      }, async (payload) => {
        const { data, error } = await supabase
          .from('help_request_comments')
          .select(`
            id, request_id, author_id, content, created_at, parent_id,
            author:profiles!help_request_comments_author_id_fkey(name, avatar_url, role, username)
          `)
          .eq('id', payload.new.id)
          .single();
        if (data && !error) {
          setComments(prev => prev.some(c => c.id === data.id) ? prev : [...prev, data as any]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [showCommentsModal]);

  // Поиск упоминаний
  useEffect(() => {
    if (!mentionSearch || mentionSearch.length < 2) {
      setMentionSuggestions([]); setShowMentions(false); return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .or(`username.ilike.%${mentionSearch}%,name.ilike.%${mentionSearch}%`)
        .limit(5);
      if (data) { setMentionSuggestions(data); setShowMentions(data.length > 0); }
    }, 300);
    return () => clearTimeout(timer);
  }, [mentionSearch]);

  // ─── СТАБИЛЬНЫЕ ОБРАБОТЧИКИ (useCallback — важно для React.memo) ─────────────

  const handleRespond = useCallback(async (requestId: string) => {
    const { error } = await respond(requestId, user?.id);
    if (!error) setAlreadyResponded(prev => new Set([...prev, requestId]));
    setShowResponseModal(null);
  }, [respond, user?.id]);

  const handleClose = useCallback(async (requestId: string) => {
    await closeRequest(requestId);
    setShowCloseModal(null);
  }, [closeRequest]);

  const handleEditRequest = useCallback((request: HelpRequestRow) => {
    setNewReq({
      type: request.type,
      urgency: request.urgency,
      title: request.title,
      location: request.location,
      description: request.description,
      contact_phone: request.contact_phone || '',
      cloudtips_url: request.cloudtips_url || '',
    });
    setEditingId(request.id);
    setShowAddModal(true);
  }, []);

  const handleOpenComments = useCallback((request: HelpRequestRow) => {
    setShowCommentsModal(request);
  }, []);

  const handleReportOpen = useCallback(
    (type: 'help_request' | 'comment', id: string) => {
      setShowReportModal({ type, id });
    },
    []
  );

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleOpenResponseModal = useCallback((id: string) => {
    setShowResponseModal(id);
  }, []);

  const handleOpenCloseModal = useCallback((id: string) => {
    setShowCloseModal(id);
  }, []);

  // ─── ДОБАВЛЕНИЕ / РЕДАКТИРОВАНИЕ ──────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newReq.title || !newReq.location || !newReq.description) return;
    setSubmitting(true);
    const targetStatus: any = featureToggles.preModeration ? 'pending' : 'active';

    if (editingId) {
      const { error } = await updateRequest(editingId, { ...newReq, status: targetStatus });
      if (error) { toast.error(error.message); setSubmitting(false); return; }
    } else {
      const { error } = await addRequest({ ...newReq, status: targetStatus }, user?.id);
      if (error) { toast.error(error.message); setSubmitting(false); return; }
    }
    setSubmitting(false);
    setShowAddModal(false);
    setEditingId(null);
    setNewReq({ type: 'other', urgency: 'normal', title: '', location: '', description: '', contact_phone: '', cloudtips_url: '' });
    if (featureToggles.preModeration) {
      toast.success(editingId ? t('yardym.moderation_edit_success') : t('yardym.moderation_success'));
    } else {
      setShowSuccessModal(true);
    }
  };

  // ─── КОММЕНТАРИЙ ──────────────────────────────────────────────────────────────
  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !showCommentsModal) return;
    const { data, error } = await supabase
      .from('help_request_comments')
      .insert({
        request_id: showCommentsModal.id,
        author_id: user.id,
        content: newComment.trim(),
        parent_id: replyTo,
      })
      .select(`
        id, request_id, author_id, content, created_at, parent_id,
        author:profiles!help_request_comments_author_id_fkey(name, avatar_url, role, username)
      `)
      .single();
    if (data && !error) {
      setComments(prev => [...prev, data as any]);
      setNewComment('');
      setReplyTo(null);
      if (!replyTo && showCommentsModal.author_id && showCommentsModal.author_id !== user.id) {
        await supabase.from('user_notifications').insert({
          user_id: showCommentsModal.author_id,
          type: 'help_response',
          title: t('yardym.new_comment_notification'),
          body: `${t('yardym.new_comment_notification')}: "${showCommentsModal.title}"`,
          link: `/yardym/${showCommentsModal.id}`,
        });
      }
      if (replyTo) {
        const parent = comments.find(c => c.id === replyTo);
        if (parent && parent.author_id !== user.id) {
          await supabase.from('user_notifications').insert({
            user_id: parent.author_id,
            type: 'comment_reply',
            title: t('yardym.reply_notification_title'),
            body: t('yardym.reply_notification_body', { title: showCommentsModal.title }),
            link: `/yardym/${showCommentsModal.id}`,
          });
        }
      }
    }
  };

  const handleCommentChange = (val: string) => {
    setNewComment(val);
    const cursorPos = (document.activeElement as HTMLTextAreaElement)?.selectionStart || 0;
    const before = val.slice(0, cursorPos);
    const lastAt = before.lastIndexOf('@');
    if (lastAt !== -1) {
      const query = before.slice(lastAt + 1);
      if (!query.includes(' ')) { setMentionSearch(query); return; }
    }
    setMentionSearch(''); setShowMentions(false);
  };

  const insertMention = (u: { username: string | null; name: string }) => {
    const cursorPos = (document.activeElement as HTMLTextAreaElement)?.selectionStart || 0;
    const before = newComment.slice(0, cursorPos);
    const after  = newComment.slice(cursorPos);
    const lastAt = before.lastIndexOf('@');
    const username = u.username || u.name.replace(/\s+/g, '_').toLowerCase();
    setNewComment(before.slice(0, lastAt) + `@${username} ` + after);
    setMentionSearch(''); setShowMentions(false);
  };

  const handleReport = async () => {
    if (!showReportModal || !user || !reportReason.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: showReportModal.type,
      target_id: showReportModal.id,
      reason: reportReason.trim(),
      status: 'pending',
    });
    setSubmitting(false);
    if (!error) {
      toast.success(t('yardym.report_success'));
      setShowReportModal(null);
      setReportReason('');
    } else {
      toast.error(t('yardym.report_error'));
    }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <SectionTabs />

      {/* Заголовок + кнопка добавления */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{t('yardym.title')}</h1>
            <p className="text-sm text-gray-500">{t('yardym.subtitle')}</p>
          </div>
          <button
            onClick={() => user ? setShowAddModal(true) : undefined}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium ${
              user ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <Plus className="w-4 h-4" />
            {t('yardym.add')}
          </button>
        </div>

        {/* Поиск */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('yardym.search_placeholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Фильтры */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 flex-shrink-0">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-transparent text-sm text-gray-700 focus:outline-none"
              >
                <option value="all">{t('yardym.filter_all_types')}</option>
                <option value="blood">{t('yardym.filter_blood')}</option>
                <option value="money">{t('yardym.filter_money')}</option>
                <option value="other">{t('yardym.filter_other')}</option>
              </select>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 flex-shrink-0">
              <select
                value={filterUrgency}
                onChange={e => setFilterUrgency(e.target.value)}
                className="bg-transparent text-sm text-gray-700 focus:outline-none"
              >
                <option value="all">{t('yardym.filter_all_urgency')}</option>
                <option value="urgent">{t('yardym.filter_urgent')}</option>
                <option value="normal">{t('yardym.filter_normal')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Срочные */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-3">{t('yardym.urgent_title')}</h2>
        {loading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : urgent.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-gray-800 font-medium">{t('yardym.no_urgent')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('yardym.no_urgent_desc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {urgent.map(r => (
              <RequestCard
                key={r.id}
                request={r}
                isUrgent
                isAuthor={user?.id === r.author_id}
                hasResponded={alreadyResponded.has(r.id)}
                isLoggedIn={!!user}
                t={t}
                onRespond={handleOpenResponseModal}
                onClose={handleOpenCloseModal}
                onEdit={handleEditRequest}
                onOpenComments={handleOpenComments}
                onReport={handleReportOpen}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Обычные */}
      <div className="px-4 pb-24">
        <h2 className="text-lg font-bold text-gray-800 mb-3">{t('yardym.all_requests')}</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : normal.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-800 font-semibold text-lg">{t('yardym.no_requests')}</p>
            <p className="text-gray-500 mt-2 max-w-[240px] mx-auto">{t('yardym.no_requests_desc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {normal.map(r => (
              <RequestCard
                key={r.id}
                request={r}
                isAuthor={user?.id === r.author_id}
                hasResponded={alreadyResponded.has(r.id)}
                isLoggedIn={!!user}
                t={t}
                onRespond={handleOpenResponseModal}
                onClose={handleOpenCloseModal}
                onEdit={handleEditRequest}
                onOpenComments={handleOpenComments}
                onReport={handleReportOpen}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── МОДАЛЬНЫЕ ОКНА ─────────────────────────────────────────────────── */}

      {/* Успех */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center modal-overlay"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="bg-white w-[280px] rounded-2xl p-8 animate-fade-in text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{t('yardym.success_title')}</h2>
            <p className="text-gray-500 text-sm mb-6">{t('yardym.success_desc')}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-colors"
            >
              {t('yardym.success_button')}
            </button>
          </div>
        </div>
      )}

      {/* Добавить / редактировать */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingId ? t('yardym.modal_edit_title') : t('yardym.modal_add_title')}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                  setNewReq({ type: 'other', urgency: 'normal', title: '', location: '', description: '', contact_phone: '', cloudtips_url: '' });
                }}
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Тип */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('yardym.label_type')}</label>
                <div className="flex gap-2">
                  {([
                    ['blood', t('yardym.filter_blood'), Droplets],
                    ['money', t('yardym.filter_money'), Banknote],
                    ['other', t('yardym.filter_other'), HelpCircle],
                  ] as const).map(([v, l, Icon]) => (
                    <button
                      key={v}
                      onClick={() => setNewReq(r => ({ ...r, type: v }))}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border text-sm ${
                        newReq.type === v
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />{l}
                    </button>
                  ))}
                </div>
              </div>
              {/* Срочность */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('yardym.label_urgency')}</label>
                <div className="flex gap-2">
                  {([['urgent', t('yardym.urgent_label')], ['normal', t('yardym.normal_label')]] as const).map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setNewReq(r => ({ ...r, urgency: v }))}
                      className={`flex-1 py-2 rounded-lg border text-sm ${
                        newReq.urgency === v
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {/* Поля формы */}
              {([
                ['title',         t('yardym.label_title'),       t('yardym.placeholder_title'),      'text'],
                ['location',      t('yardym.label_location'),    t('yardym.placeholder_location'),   'text'],
                ['contact_phone', t('yardym.label_phone'),       t('yardym.placeholder_phone'),      'tel'],
                ['cloudtips_url', t('yardym.label_cloudtips'),   t('yardym.placeholder_cloudtips'), 'url'],
              ] as const).map(([f, l, ph, tInput]) => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                  <input
                    type={tInput}
                    value={(newReq as any)[f]}
                    placeholder={ph}
                    onChange={e => {
                      let val = e.target.value;
                      if (f === 'contact_phone') {
                        const x = val.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
                        if (!x) return;
                        if (!x[2]) val = x[1] ? `+${x[1]}` : '';
                        else val = `+${x[1] || '7'} (${x[2]}${x[3] ? `) ${x[3]}` : ''}${x[4] ? `-${x[4]}` : ''}${x[5] ? `-${x[5]}` : ''}`;
                        if (val.length > 18) val = val.substring(0, 18);
                      }
                      setNewReq(r => ({ ...r, [f]: val }));
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              ))}
              {/* Описание */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">{t('yardym.label_description')}</label>
                  <span className={`text-xs ${newReq.description.length > 500 ? 'text-rose-500' : 'text-gray-400'}`}>
                    {newReq.description.length}/500
                  </span>
                </div>
                <textarea
                  value={newReq.description}
                  rows={3}
                  maxLength={500}
                  onChange={e => setNewReq(r => ({ ...r, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={!newReq.title || !newReq.location || !newReq.description || submitting}
                className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {submitting ? t('yardym.publishing') : t('yardym.publish')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Подтверждение отклика */}
      {showResponseModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay"
          onClick={() => setShowResponseModal(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('yardym.respond_confirm_title')}</h2>
            <p className="text-gray-600 mb-6">{t('yardym.respond_confirm_desc')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResponseModal(null)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleRespond(showResponseModal)}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Подтверждение закрытия */}
      {showCloseModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay"
          onClick={() => setShowCloseModal(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('yardym.close_confirm_title')}</h2>
            <p className="text-gray-600 mb-6">{t('yardym.close_confirm_desc')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseModal(null)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleClose(showCloseModal)}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600"
              >
                {t('yardym.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Комментарии */}
      {showCommentsModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay"
          onClick={() => setShowCommentsModal(null)}
        >
          <div
            className="bg-white w-full max-w-md h-[80vh] sm:h-[600px] rounded-t-2xl sm:rounded-2xl flex flex-col animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Шапка */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{t('yardym.comments_title')}</h2>
                <p className="text-xs text-gray-500 truncate max-w-[250px]">{showCommentsModal.title}</p>
              </div>
              <button
                onClick={() => setShowCommentsModal(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Список комментариев */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {loadingComments ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500">{t('yardym.no_comments')}</p>
                  <p className="text-sm text-gray-400 mt-1">{t('yardym.no_comments_desc')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.filter(c => !c.parent_id).map(comment => (
                    <div key={comment.id} className="space-y-3">
                      <div className={`flex gap-3 ${comment.author_id === user?.id ? 'flex-row-reverse' : ''}`}>
                        <button
                          onClick={() => navigate(`/user/${comment.author_id}`)}
                          className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden"
                        >
                          {comment.author?.avatar_url ? (
                            <img src={comment.author.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-emerald-700 font-medium text-sm">
                              {(comment.author?.name || 'U')[0].toUpperCase()}
                            </span>
                          )}
                        </button>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 relative group ${
                            comment.author_id === user?.id
                              ? 'bg-emerald-500 text-white rounded-tr-sm'
                              : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1 gap-4">
                            <span
                              className={`text-xs font-bold truncate ${
                                comment.author_id === user?.id ? 'text-emerald-100' : 'text-emerald-600'
                              }`}
                            >
                              {comment.author?.name || t('auth.user')}
                              {comment.author?.username && (
                                <span className="ml-1 font-normal opacity-70">@{comment.author.username}</span>
                              )}
                            </span>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setReplyTo(comment.id);
                                  setNewComment(`@${comment.author?.username || comment.author?.name}, `);
                                }}
                                className={`text-[10px] font-medium hover:underline ${
                                  comment.author_id === user?.id ? 'text-emerald-100' : 'text-emerald-500'
                                }`}
                              >
                                {t('yardym.reply')}
                              </button>
                              {comment.author_id !== user?.id && (
                                <button
                                  onClick={() => setShowReportModal({ type: 'comment', id: comment.id })}
                                  className="text-gray-300 hover:text-rose-500"
                                >
                                  <Flag className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {comment.content.split(/(@[a-zA-Z0-9_]+)/g).map((part, i) =>
                              part.startsWith('@') ? (
                                <button
                                  key={i}
                                  onClick={e => {
                                    e.stopPropagation();
                                    supabase.from('profiles').select('id').eq('username', part.slice(1)).single()
                                      .then(({ data }) => { if (data) navigate(`/user/${data.id}`); });
                                  }}
                                  className="font-bold text-blue-400 hover:underline"
                                >
                                  {part}
                                </button>
                              ) : part
                            )}
                          </p>
                          <p className={`text-[10px] mt-1 text-right ${comment.author_id === user?.id ? 'text-emerald-100' : 'text-gray-400'}`}>
                            {format(new Date(comment.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                      {/* Ответы на комментарий */}
                      {comments.filter(r => r.parent_id === comment.id).map(reply => (
                        <div key={reply.id} className={`flex gap-3 ml-8 ${reply.author_id === user?.id ? 'flex-row-reverse' : ''}`}>
                          <button
                            onClick={() => navigate(`/user/${reply.author_id}`)}
                            className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 overflow-hidden"
                          >
                            {reply.author?.avatar_url ? (
                              <img src={reply.author.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="text-emerald-700 text-[10px] font-medium">{(reply.author?.name || 'U')[0].toUpperCase()}</span>
                            )}
                          </button>
                          <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 ${
                            reply.author_id === user?.id
                              ? 'bg-emerald-400 text-white rounded-tr-sm'
                              : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                          }`}>
                            <div className={`mb-1 pl-2 border-l-2 text-[10px] py-0.5 rounded-r bg-black/5 ${
                              reply.author_id === user?.id ? 'border-emerald-200 text-emerald-50' : 'border-emerald-400 text-gray-500'
                            }`}>
                              <p className="font-bold truncate">{comment.author?.name}</p>
                              <p className="truncate opacity-80">{comment.content}</p>
                            </div>
                            <span className={`text-[9px] font-bold ${reply.author_id === user?.id ? 'text-emerald-50' : 'text-emerald-600'}`}>
                              {reply.author?.name}
                            </span>
                            <p className="text-xs whitespace-pre-wrap break-words mt-0.5">{reply.content}</p>
                            <p className={`text-[9px] mt-0.5 text-right ${reply.author_id === user?.id ? 'text-emerald-50' : 'text-gray-400'}`}>
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

            {/* Поле ввода */}
            <div className="p-4 bg-white border-t border-gray-100">
              {user ? (
                <div className="space-y-2 relative">
                  {/* Подсказки @mentions */}
                  {showMentions && mentionSuggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl mb-2 overflow-hidden z-[120]">
                      {mentionSuggestions.map((s, idx) => (
                        <button
                          key={s.id}
                          onClick={() => insertMention(s)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 transition-colors text-left ${
                            idx === mentionIndex ? 'bg-emerald-50' : ''
                          }`}
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

                  {/* Цитата ответа */}
                  {replyTo && (
                    <div className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500">
                        <Trans
                          i18nKey="yardym.reply_to"
                          values={{ name: comments.find(c => c.id === replyTo)?.author?.name }}
                          components={[<span className="font-bold text-emerald-600" />]}
                        />
                      </p>
                      <button
                        onClick={() => { setReplyTo(null); setNewComment(''); }}
                        className="text-gray-400 hover:text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Textarea + Send */}
                  <div className="flex items-end gap-2">
                    <textarea
                      value={newComment}
                      onChange={e => handleCommentChange(e.target.value)}
                      placeholder={t('yardym.comment_placeholder')}
                      className="flex-1 max-h-32 min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
                      rows={1}
                      onKeyDown={e => {
                        if (showMentions && mentionSuggestions.length > 0) {
                          if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(p => (p + 1) % mentionSuggestions.length); }
                          else if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex(p => (p - 1 + mentionSuggestions.length) % mentionSuggestions.length); }
                          else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(mentionIndex >= 0 ? mentionSuggestions[mentionIndex] : mentionSuggestions[0]); }
                          else if (e.key === 'Escape') setShowMentions(false);
                        } else if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault(); handleAddComment();
                        }
                      }}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="w-11 h-11 flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Send className="w-5 h-5 ml-1" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-center py-2 text-sm text-gray-500">{t('yardym.login_to_comment')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Жалоба */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay"
          onClick={() => setShowReportModal(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">{t('yardym.report_title')}</h2>
              <button
                onClick={() => setShowReportModal(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{t('yardym.report_desc')}</p>
            <textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder={t('yardym.report_placeholder')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent mb-4 resize-none h-32"
            />
            <button
              onClick={handleReport}
              disabled={submitting || !reportReason.trim()}
              className="w-full bg-rose-500 text-white font-semibold py-3 rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('yardym.report_sending') : t('yardym.report_send')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MicroYardym;
