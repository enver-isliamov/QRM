import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';

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
    <div className="bg-background border-b border-border overflow-x-auto no-scrollbar sticky top-0 z-40">
      <div className="flex px-4 min-w-max">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`px-4 py-3.5 text-sm font-medium transition-colors relative whitespace-nowrap ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeSectionTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
