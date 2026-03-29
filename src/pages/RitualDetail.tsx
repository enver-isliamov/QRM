import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, BookOpen } from 'lucide-react';
import { useRitualDetail } from '../hooks/useRituals';

function RitualDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { ritual, steps, loading } = useRitualDetail(id ?? '');

  const isCrh = i18n.language === 'crh';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!ritual) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600">{t('rituals.not_found')}</h2>
          <button onClick={() => navigate('/rituals')} className="mt-4 text-emerald-600 font-medium">
            {t('rituals.back_to_list')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <button onClick={() => navigate('/rituals')} className="flex items-center gap-2 text-gray-600 mb-2">
          <ChevronLeft className="w-5 h-5" />
          <span>{t('common.back')}</span>
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          {isCrh && ritual.title_crh ? ritual.title_crh : ritual.title}
        </h1>
        {(ritual.subtitle || ritual.subtitle_crh) && (
          <p className="text-sm text-gray-500">
            {isCrh && ritual.subtitle_crh ? ritual.subtitle_crh : ritual.subtitle}
          </p>
        )}
      </div>

      <div className="p-4 pb-20">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {isCrh && step.title_crh ? step.title_crh : step.title}
                  </h3>
                  {step.description && !isCrh && <p className="text-sm text-gray-600 mb-2">{step.description}</p>}
                  {step.description_crh && isCrh && <p className="text-sm text-gray-600 mb-2">{step.description_crh}</p>}
                  {step.description && isCrh && !step.description_crh && <p className="text-sm text-gray-600 mb-2">{step.description}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 mb-1">{t('rituals.note_title')}</h3>
              <p className="text-sm text-amber-700">
                {t('rituals.note_desc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RitualDetail;
