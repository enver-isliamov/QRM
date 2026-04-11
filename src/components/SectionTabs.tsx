import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function SectionTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const tabs = [
    { path: '/village-meetings', label: t('nav.meetings') },
    { path: '/micro-yardym', label: t('nav.yardym') },
    { path: '/rituals', label: t('nav.rituals') },
    { path: '/ethno-calendar', label: t('nav.calendar') },
  ];

  return (
    <div className="bg-white border-b border-gray-100 overflow-x-auto no-scrollbar sticky top-0 z-40">
      <div className="flex px-4 min-w-max">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`px-4 py-3.5 text-sm font-medium transition-colors relative whitespace-nowrap ${
                isActive ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
