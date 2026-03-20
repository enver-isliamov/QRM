import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { rituals } from '../data/rituals';

function Rituals() {
  const navigate = useNavigate();
  
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ring': return <div className="text-3xl">💍</div>;
      case 'users': return <div className="text-3xl">🤲</div>;
      case 'heart': return <div className="text-3xl">👶</div>;
      default: return <BookOpen className="w-8 h-8 text-emerald-600" />;
    }
  };
  
  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Обрядовый гид</h1>
        <p className="text-sm text-gray-500">Традиции и обряды крымских татар</p>
      </div>
      
      {/* Rituals List */}
      <div className="p-4 pb-20">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Порядок действий (Протоколы)</h2>
        
        <div className="grid grid-cols-2 gap-3">
          {rituals.map((ritual) => (
            <button
              key={ritual.id}
              onClick={() => navigate(`/rituals/${ritual.id}`)}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left touch-feedback hover:border-emerald-200 transition-colors"
            >
              <div className="mb-3">
                {getIcon(ritual.icon)}
              </div>
              <h3 className="font-semibold text-gray-800">{ritual.title}</h3>
              <p className="text-sm text-gray-500">{ritual.subtitle}</p>
            </button>
          ))}
        </div>
        
        {/* Info Section */}
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-800 mb-1">О традициях</h3>
              <p className="text-sm text-emerald-700">
                Крымские татары, с давних пор проживавшие на полуострове Крым, 
                как и все народы с многовековым прошлым, имели свой быт, традиции и культуру.
              </p>
            </div>
          </div>
        </div>
        
        {/* Additional Info Cards */}
        <div className="mt-4 space-y-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Свадебный обряд</h3>
            <p className="text-sm text-gray-600">
              Свадебная обрядность крымских татар делится на три основных периода: 
              предсвадебный, собственно свадьбу и послесвадебный период.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Погребальный обряд</h3>
            <p className="text-sm text-gray-600">
              Обряд похорон (дженазе) совершается согласно установившимся правилам 
              и обычаям, с соблюдением законов Шариата.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Rituals;
