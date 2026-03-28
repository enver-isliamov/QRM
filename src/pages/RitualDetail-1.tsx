import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, BookOpen } from 'lucide-react';
import { useRitualDetail } from '../hooks/useRituals';

function RitualDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ritual, steps, loading } = useRitualDetail(id ?? '');

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
          <h2 className="text-xl font-semibold text-gray-600">Обряд не найден</h2>
          <button onClick={() => navigate('/rituals')} className="mt-4 text-emerald-600 font-medium">
            Вернуться к списку
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
          <span>Назад</span>
        </button>
        <h1 className="text-xl font-bold text-gray-800">{ritual.title}</h1>
        {ritual.subtitle && <p className="text-sm text-gray-500">{ritual.subtitle}</p>}
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
                  <h3 className="font-semibold text-gray-800 mb-2">{step.title}</h3>
                  {step.description && <p className="text-sm text-gray-600 mb-2">{step.description}</p>}
                  {step.description_crh && <p className="text-sm text-gray-500 italic">{step.description_crh}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 mb-1">Примечание</h3>
              <p className="text-sm text-amber-700">
                Традиции могут немного отличаться в разных регионах и семьях.
                Рекомендуется консультироваться со старейшинами и религиозными деятелями.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RitualDetail;
