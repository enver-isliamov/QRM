import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Plus, X, Bell, Users, ChevronRight, Search, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { ru, tr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useMeetings } from '../hooks/useMeetings';
import { useAuth } from '../hooks/useAuth';
import { MeetingRow } from '../lib/supabase';
import { Skeleton } from '../components/ui/Skeleton';
import SectionTabs from '../components/SectionTabs';

function VillageMeetings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { meetings, loading, toggleAttend, toggleSubscribe, addMeeting, updateMeeting, isGoing, isSubscribed } = useMeetings(user?.id ?? null);

  const dateLocale = i18n.language === 'crh' ? tr : ru;

  useEffect(() => {
    if (meetings.length > 0) {
      console.log('DEBUG: VillageMeetings - loaded meetings:', meetings.map(m => ({ village: m.village, url: m.fund_cloudtips_url })));
    }
  }, [meetings]);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ village: '', organizer: '', location: '', meeting_date: '', description: '', organizer_phone: '', fund_purpose: '', fund_goal: '', fund_cloudtips_url: '' });

  const filteredMeetings = meetings.filter(m => {
    const matchesSearch = m.village.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (m.location && m.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          m.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleAdd = async () => {
    if (!form.village || !form.meeting_date || !user) return;
    setSubmitting(true);
    
    const data = {
      village: form.village, village_crh: form.village,
      organizer: form.organizer || t('meetings.organizer_default'),
      location: form.location || undefined,
      meeting_date: form.meeting_date,
      description: form.description || undefined,
      organizer_phone: form.organizer_phone || undefined,
      fund_purpose: form.fund_purpose || undefined,
      fund_goal: form.fund_goal ? +form.fund_goal : undefined,
      fund_cloudtips_url: form.fund_cloudtips_url || undefined,
      status: 'upcoming',
    };

    if (editingId) {
      await updateMeeting(editingId, data as any);
    } else {
      await addMeeting(data as any, user.id);
    }
    
    setSubmitting(false);
    setShowAdd(false);
    setEditingId(null);
    setForm({ village: '', organizer: '', location: '', meeting_date: '', description: '', organizer_phone: '', fund_purpose: '', fund_goal: '', fund_cloudtips_url: '' });
  };

  const MeetingCard = ({ m }: { m: MeetingRow }) => {
    const going = isGoing(m.id);
    const subbed = isSubscribed(m.id);
    const progress = m.fund_progress ?? (m.fund_goal && m.fund_current != null ? Math.round((m.fund_current / m.fund_goal) * 100) : null);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Card header - clickable to detail */}
        <button onClick={() => navigate(`/meetings/${m.id}`)} className="w-full text-left p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-800 flex-1 pr-2">{m.village}</h3>
            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded whitespace-nowrap">
              {format(new Date(m.meeting_date), 'd MMMM', { locale: dateLocale })}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-1">{t('meetings.organizer')}: {m.organizer}</p>
          {m.location && (
            <div className="flex items-center gap-1 text-rose-500 text-sm mb-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span>{m.location}</span>
            </div>
          )}
          {m.description && <p className="text-sm text-gray-500 line-clamp-2">{m.description}</p>}
          
          {m.fund_cloudtips_url && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg w-fit">
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              <span>{t('meetings.fund_active')}</span>
            </div>
          )}

          {progress != null && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">{m.fund_purpose}</span>
                <span className="font-semibold text-emerald-600">{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <Users className="w-3.5 h-3.5" /><span>{t('meetings.attendees_count', { count: m.attendees_count ?? 0 })}</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </div>
        </button>

        {/* Action bar */}
        <div className="px-4 pb-4 flex gap-2">
          {user?.id === m.author_id && (
            <button
              onClick={() => {
                setForm({
                  village: m.village,
                  organizer: m.organizer,
                  location: m.location || '',
                  meeting_date: m.meeting_date.split('T')[0],
                  description: m.description || '',
                  organizer_phone: m.organizer_phone || '',
                  fund_purpose: m.fund_purpose || '',
                  fund_goal: m.fund_goal?.toString() || '',
                  fund_cloudtips_url: m.fund_cloudtips_url || ''
                });
                setEditingId(m.id);
                setShowAdd(true);
              }}
              className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
              <Plus className="w-4 h-4 rotate-45" />
            </button>
          )}
          {!m.meeting_time && user && (
            <button onClick={() => toggleSubscribe(m.id)}
              title={subbed ? t('meetings.unsubscribe') : t('meetings.subscribe')}
              className={`p-2.5 rounded-lg border transition-colors ${subbed ? 'bg-amber-50 border-amber-300 text-amber-600' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}>
              <Bell className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => user ? toggleAttend(m.id) : navigate('/login')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
              going ? 'bg-emerald-500 text-white' : user ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-400'
            }`}>
            {going ? t('meetings.i_am_going') : t('meetings.i_will_go')}
          </button>
          {m.fund_cloudtips_url && (
            <a
              href={m.fund_cloudtips_url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-500 text-white rounded-lg font-semibold text-sm hover:bg-rose-600 transition-colors"
            >
              <Heart className="w-4 h-4 fill-white" />
              {t('meetings.help')}
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <SectionTabs />
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{t('meetings.title')}</h1>
            <p className="text-sm text-gray-500">{t('meetings.subtitle')}</p>
          </div>
          {user && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" />{t('meetings.add')}
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('meetings.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="p-4 pb-24">
        <h2 className="text-lg font-bold text-gray-800 mb-3">{t('meetings.upcoming')}</h2>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-800 font-semibold text-lg">{t('meetings.no_upcoming')}</p>
            <p className="text-gray-500 mt-2 max-w-[240px] mx-auto">
              {t('meetings.no_upcoming_desc')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">{filteredMeetings.map(m => <MeetingCard key={m.id} m={m} />)}</div>
        )}

        {!user && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-700">{t('meetings.login_prompt')}</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => { setShowAdd(false); setEditingId(null); }}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">{editingId ? t('meetings.edit_title') : t('meetings.new_title')}</h2>
              <button onClick={() => { setShowAdd(false); setEditingId(null); }}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              {[
                ['village', t('meetings.village_label'), t('meetings.village_placeholder'), 'text'],
                ['organizer', t('meetings.organizer_label'), t('meetings.organizer_default'), 'text'],
                ['organizer_phone', t('meetings.phone_label'), '+7 (978) 000-00-00', 'tel'],
                ['location', t('meetings.location_label'), t('meetings.location_placeholder'), 'text'],
                ['meeting_date', t('meetings.date_label'), '', 'date'],
                ['fund_purpose', t('meetings.fund_purpose_label'), t('meetings.fund_purpose_placeholder'), 'text'],
                ['fund_goal', t('meetings.fund_goal_label'), '500000', 'number'],
                ['fund_cloudtips_url', t('meetings.fund_cloudtips_label'), 'https://pay.cloudtips.ru/...', 'url'],
              ].map(([f, l, ph, t_field]) => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                  <input type={t_field as string} value={(form as any)[f]} placeholder={ph as string}
                    onChange={e => {
                      let val = e.target.value;
                      if (f === 'organizer_phone') {
                        const x = val.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
                        if (!x) return;
                        if (!x[2]) val = x[1] ? `+${x[1]}` : '';
                        else val = `+${x[1] || '7'} (${x[2]}${x[3] ? `) ${x[3]}` : ''}${x[4] ? `-${x[4]}` : ''}${x[5] ? `-${x[5]}` : ''}`;
                        if (val.length > 18) val = val.substring(0, 18);
                      }
                      setForm((prev: any) => ({ ...prev, [f]: val }));
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('meetings.description_label')}</label>
                <textarea value={form.description} rows={3}
                  onChange={e => setForm((prev: any) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
              </div>
              <button onClick={handleAdd} disabled={!form.village || !form.meeting_date || submitting}
                className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                {submitting ? t('meetings.saving') : (editingId ? t('meetings.save_changes') : t('meetings.create_meeting'))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VillageMeetings;
