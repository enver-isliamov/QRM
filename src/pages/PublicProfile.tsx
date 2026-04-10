import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Star, Shield, MessageCircle, Calendar } from 'lucide-react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ICON_MAP, BADGE_COLORS } from '../lib/constants';

export default function PublicProfile() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('id, name, avatar_url, role, village, trust_score, badges, created_at').eq('id', id).single();
      if (data) setProfile(data as Profile);
      setLoading(false);
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">{t('public_profile.user_not_found')}</p>
        <button onClick={() => navigate(-1)} className="text-emerald-600 font-medium">{t('public_profile.go_back')}</button>
      </div>
    );
  }

  const badges = Array.isArray(profile.badges) ? profile.badges.map((b: any) => ({
    id: b.id,
    name: b.name,
    icon: ICON_MAP[b.icon] || Shield,
    color: BADGE_COLORS[b.id] || 'text-gray-500 bg-gray-50 border-gray-200',
    description: b.desc || b.description
  })) : [];

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-4 py-4 border-b border-gray-200 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">{t('public_profile.title')}</h1>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center mb-4">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-3xl font-bold mb-4 overflow-hidden shadow-inner">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              profile.name.charAt(0).toUpperCase()
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1 flex items-center justify-center gap-2">
            {profile.name}
            {profile.role === 'admin' && <span title={t('public_profile.admin_title')}><Shield className="w-5 h-5 text-emerald-500" /></span>}
            {profile.role === 'moderator' && <span title={t('public_profile.moderator_title')}><Shield className="w-5 h-5 text-blue-500" /></span>}
          </h2>
          
          {profile.village && (
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-2">
              <MapPin className="w-4 h-4" />
              <span>{profile.village}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-4">
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('public_profile.member_since')} {new Date(profile.created_at).toLocaleDateString(i18n.language === 'crh' ? 'tr-TR' : 'ru-RU')}</span>
          </div>

          <div className="flex items-center justify-center gap-4 w-full border-t border-gray-100 pt-4 mt-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-lg">
                <Star className="w-5 h-5 fill-current" />
                {profile.trust_score ?? 0}
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">{t('public_profile.trust_score')}</p>
            </div>
          </div>
        </div>

        {badges.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">{t('public_profile.badges')}</h3>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, idx) => (
                <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${badge.color}`} title={badge.description}>
                  <badge.icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {user && user.id !== profile.id && (
          <button 
            onClick={() => alert(t('public_profile.chat_in_dev'))}
            className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <MessageCircle className="w-5 h-5" />
            {t('public_profile.send_message')}
          </button>
        )}
      </div>
    </div>
  );
}
