import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';
import { useRituals } from '../hooks/useRituals';

function Rituals() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { rituals, loading } = useRituals();

  const isCrh = i18n.language === 'crh';

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'ring':  return <div className="text-3xl">💍</div>;
      case 'users': return <div className="text-3xl">🤲</div>;
      case 'heart': return <div className="text-3xl">👶</div>;
      default:      return <BookOpen className="w-8 h-8 text-emerald-600" />;
    }
  };

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">{t('rituals.title')}</h1>
        <p className="text-sm text-gray-500">{t('rituals.subtitle')}</p>
      </div>

      <div className="p-4 pb-20">
        <h2 className="text-lg font-bold text-gray-800 mb-3">{t('rituals.protocols')}</h2>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {rituals.map(ritual => (
              <button
                key={ritual.id}
                onClick={() => navigate(`/rituals/${ritual.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left touch-feedback hover:border-emerald-200 transition-colors"
              >
                <div className="mb-3">{getIcon(ritual.icon)}</div>
                <h3 className="font-semibold text-gray-800">{isCrh && ritual.title_crh ? ritual.title_crh : ritual.title}</h3>
                <p className="text-sm text-gray-500">{isCrh && ritual.subtitle_crh ? ritual.subtitle_crh : ritual.subtitle}</p>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-800 mb-1">{t('rituals.about_title')}</h3>
              <p className="text-sm text-emerald-700">
                {t('rituals.about_desc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Rituals;
