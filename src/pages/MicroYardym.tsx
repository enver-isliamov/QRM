import { useState, useEffect } from 'react';
import { Heart, Phone, MapPin, AlertCircle, Plus, X, Droplets, Banknote, HelpCircle, MessageCircle, Send, Check, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { useHelpRequests } from '../hooks/useHelpRequests';
import { useAuth } from '../hooks/useAuth';
import { HelpRequestRow, HelpRequestCommentRow, supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

type NewReq = { type: 'blood' | 'money' | 'other'; urgency: 'urgent' | 'normal'; title: string; location: string; description: string; contact_phone: string };

function MicroYardym() {
  const { user } = useAuth();
  const { featureToggles } = useStore();
  const { urgent, normal, loading, addRequest, respond, closeRequest } = useHelpRequests();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState<string | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState<HelpRequestRow | null>(null);
  const [showReportModal, setShowReportModal] = useState<{ type: 'help_request' | 'comment', id: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [comments, setComments] = useState<HelpRequestCommentRow[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // IDs обращений на которые текущий юзер уже откликнулся (из БД)
  const [alreadyResponded, setAlreadyResponded] = useState<Set<string>>(new Set());
  const [newReq, setNewReq] = useState<NewReq>({ type: 'other', urgency: 'normal', title: '', location: '', description: '', contact_phone: '' });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Загружаем с БД: на что уже откликнулся пользователь
  useEffect(() => {
    if (!user) { setAlreadyResponded(new Set()); return; }
    supabase.from('help_responses').select('request_id').eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setAlreadyResponded(new Set(data.map(r => r.request_id)));
      });
  }, [user]);

  useEffect(() => {
    if (!showCommentsModal) {
      setComments([]);
      return;
    }
    const fetchComments = async () => {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('help_request_comments')
        .select(`
          id, request_id, author_id, content, created_at,
          author:profiles!help_request_comments_author_id_fkey(name, avatar_url, role)
        `)
        .eq('request_id', showCommentsModal.id)
        .order('created_at', { ascending: true });
      
      if (data && !error) {
        setComments(data as any);
      }
      setLoadingComments(false);
    };
    fetchComments();
  }, [showCommentsModal]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !showCommentsModal) return;
    const { data, error } = await supabase
      .from('help_request_comments')
      .insert({
        request_id: showCommentsModal.id,
        author_id: user.id,
        content: newComment.trim()
      })
      .select(`
        id, request_id, author_id, content, created_at,
        author:profiles!help_request_comments_author_id_fkey(name, avatar_url, role)
      `)
      .single();
    
    if (data && !error) {
      setComments(prev => [...prev, data as any]);
      setNewComment('');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blood': return <Droplets className="w-5 h-5" />;
      case 'money': return <Banknote className="w-5 h-5" />;
      default:      return <HelpCircle className="w-5 h-5" />;
    }
  };

  const handleAdd = async () => {
    if (!newReq.title || !newReq.location || !newReq.description) return;
    setSubmitting(true);
    const initialStatus = featureToggles.preModeration ? 'pending' : 'active';
    await addRequest({ ...newReq, status: initialStatus }, user?.id);
    setSubmitting(false);
    setShowAddModal(false);
    setNewReq({ type: 'other', urgency: 'normal', title: '', location: '', description: '', contact_phone: '' });
    if (featureToggles.preModeration) {
      showToast('Обращение отправлено на модерацию');
    } else {
      showToast('Обращение опубликовано');
    }
  };

  const handleRespond = async (requestId: string) => {
    const { error } = await respond(requestId, user?.id);
    if (!error) {
      setAlreadyResponded(prev => new Set([...prev, requestId]));
    }
    setShowResponseModal(null);
  };

  const handleClose = async (requestId: string) => {
    await closeRequest(requestId);
    setShowCloseModal(null);
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
      showToast('Жалоба отправлена');
      setShowReportModal(null);
      setReportReason('');
    } else {
      showToast('Ошибка при отправке жалобы');
    }
  };

  const RequestCard = ({ request, isUrgent }: { request: HelpRequestRow; isUrgent?: boolean }) => {
    const hasResponded = alreadyResponded.has(request.id);
    const isAuthor = user?.id === request.author_id;
    return (
      <div className={`rounded-xl p-4 border ${isUrgent ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className="flex items-start justify-between mb-2">
          {isUrgent ? (
            <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{request.title}
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                {getTypeIcon(request.type)}
              </div>
              <span className="font-medium text-gray-800">{request.title}</span>
            </div>
          )}
          <span className="text-xs text-gray-400">{format(new Date(request.created_at), 'dd.MM HH:mm')}</span>
        </div>

        <div className="flex items-center gap-1 text-gray-600 mb-1">
          <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
          <span className="text-sm">{request.location}</span>
        </div>
        <p className="text-sm text-gray-600 mb-3">{request.description}</p>

        {request.contact_phone && (
          <a href={`tel:${request.contact_phone}`} className="flex items-center gap-1 text-emerald-700 mb-3 text-sm hover:underline">
            <Phone className="w-4 h-4" />{request.contact_phone}
          </a>
        )}

        {!isUrgent && (
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">Откликов: {request.responses_count ?? 0}</p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowReportModal({ type: 'help_request', id: request.id })}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-rose-500 transition-colors">
                <Flag className="w-3 h-3" />
              </button>
              <button 
                onClick={() => setShowCommentsModal(request)}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
                Обсуждение
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {isAuthor ? (
            <button
              onClick={() => setShowCloseModal(request.id)}
              className="w-full font-semibold py-3 rounded-lg transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200">
              Закрыть обращение
            </button>
          ) : user ? (
            <button
              onClick={() => !hasResponded && setShowResponseModal(request.id)}
              disabled={hasResponded}
              className={`w-full font-semibold py-3 rounded-lg transition-colors ${
                hasResponded
                  ? 'bg-gray-100 text-gray-400 cursor-default'
                  : isUrgent
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}>
              {hasResponded ? '✓ Вы откликнулись' : isUrgent ? 'Я МОГУ ПОМОЧЬ' : 'Откликнуться'}
            </button>
          ) : (
            <button onClick={() => {}} disabled className="w-full bg-gray-100 text-gray-400 font-semibold py-3 rounded-lg text-sm">
              Войдите, чтобы откликнуться
            </button>
          )}
          {isUrgent && (
            <div className="flex gap-2">
              <button 
                onClick={() => setShowReportModal({ type: 'help_request', id: request.id })}
                className="flex items-center justify-center w-12 bg-gray-50 text-gray-400 rounded-lg hover:bg-rose-50 hover:text-rose-500 transition-colors">
                <Flag className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowCommentsModal(request)}
                className="flex items-center justify-center w-12 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Микро-Ярдым</h1>
            <p className="text-sm text-gray-500">Взаимопомощь сообщества</p>
          </div>
          <button onClick={() => user ? setShowAddModal(true) : undefined}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium ${user ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
            <Plus className="w-4 h-4" />Добавить
          </button>
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Нужна помощь прямо сейчас</h2>
        {loading ? <div className="h-32 bg-white rounded-xl animate-pulse border border-gray-100" />
        : urgent.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <Heart className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-emerald-700">Сейчас нет срочных обращений</p>
          </div>
        ) : (
          <div className="space-y-3">{urgent.map(r => <RequestCard key={r.id} request={r} isUrgent />)}</div>
        )}
      </div>

      <div className="px-4 pb-24">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Все обращения</h2>
        {loading ? (
          <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-100" />)}</div>
        ) : normal.length === 0 ? (
          <div className="text-center py-8">
            <HelpCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Нет активных обращений</p>
          </div>
        ) : (
          <div className="space-y-3">{normal.map(r => <RequestCard key={r.id} request={r} />)}</div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Новое обращение</h2>
              <button onClick={() => setShowAddModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип помощи</label>
                <div className="flex gap-2">
                  {([['blood','Кровь',Droplets],['money','Финансы',Banknote],['other','Другое',HelpCircle]] as const).map(([v,l,Icon]) => (
                    <button key={v} onClick={() => setNewReq(r => ({ ...r, type: v }))}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border text-sm ${newReq.type === v ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}>
                      <Icon className="w-4 h-4" />{l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Срочность</label>
                <div className="flex gap-2">
                  {([['urgent','🔴 Срочно'],['normal','Обычно']] as const).map(([v,l]) => (
                    <button key={v} onClick={() => setNewReq(r => ({ ...r, urgency: v }))}
                      className={`flex-1 py-2 rounded-lg border text-sm ${newReq.urgency === v ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}>{l}</button>
                  ))}
                </div>
              </div>
              {[['title','Заголовок','Нужна кровь 4+','text'],['location','Место','Симферополь, адрес','text'],['contact_phone','Телефон','+7 (978)...','tel']].map(([f,l,ph,t]) => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                  <input type={t} value={(newReq as any)[f]} placeholder={ph}
                    onChange={e => setNewReq(r => ({ ...r, [f]: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea value={newReq.description} rows={3}
                  onChange={e => setNewReq(r => ({ ...r, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
              </div>
              <button onClick={handleAdd} disabled={!newReq.title || !newReq.location || !newReq.description || submitting}
                className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                {submitting ? 'Публикация...' : 'Опубликовать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Respond Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setShowResponseModal(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Вы готовы помочь?</h2>
            <p className="text-gray-600 mb-6">Нажимая «Подтвердить», вы сообщаете о своей готовности. Организатор увидит ваш отклик и может связаться с вами.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowResponseModal(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">Отмена</button>
              <button onClick={() => handleRespond(showResponseModal)} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600">Подтвердить</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setShowCloseModal(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Закрыть обращение?</h2>
            <p className="text-gray-600 mb-6">Вы уверены, что хотите закрыть это обращение? Оно будет отмечено как завершенное и больше не будет отображаться в активных.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCloseModal(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">Отмена</button>
              <button onClick={() => handleClose(showCloseModal)} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600">Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setShowCommentsModal(null)}>
          <div className="bg-white w-full max-w-md h-[80vh] sm:h-[600px] rounded-t-2xl sm:rounded-2xl flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Обсуждение</h2>
                <p className="text-xs text-gray-500 truncate max-w-[250px]">{showCommentsModal.title}</p>
              </div>
              <button onClick={() => setShowCommentsModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {loadingComments ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500">Пока нет комментариев</p>
                  <p className="text-sm text-gray-400 mt-1">Напишите первым, чтобы уточнить детали</p>
                </div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className={`flex gap-3 ${comment.author_id === user?.id ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {comment.author?.avatar_url ? (
                        <img src={comment.author.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-emerald-700 font-medium text-sm">
                          {(comment.author?.name || 'U')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 relative group ${
                      comment.author_id === user?.id 
                        ? 'bg-emerald-500 text-white rounded-tr-sm' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                    }`}>
                      {comment.author_id !== user?.id && (
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-emerald-600">{comment.author?.name || 'Пользователь'}</p>
                          <button 
                            onClick={() => setShowReportModal({ type: 'comment', id: comment.id })}
                            className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Flag className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${comment.author_id === user?.id ? 'text-emerald-100' : 'text-gray-400'}`}>
                        {format(new Date(comment.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              {user ? (
                <div className="flex items-end gap-2">
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Написать комментарий..."
                    className="flex-1 max-h-32 min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
                    rows={1}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  <button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="w-11 h-11 flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                    <Send className="w-5 h-5 ml-1" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-2 text-sm text-gray-500">
                  Войдите, чтобы оставлять комментарии
                </div>
              )}
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
            <p className="text-sm text-gray-600 mb-4">Опишите причину жалобы. Модераторы проверят информацию.</p>
            <textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="Причина жалобы..."
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

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] animate-slide-up">
          <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium">
            <Check className="w-5 h-5 text-emerald-400" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

export default MicroYardym;
