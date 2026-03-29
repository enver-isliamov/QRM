import { EthnoEvent } from '../types';

export const ethnoEvents: EthnoEvent[] = [
  {
    id: '1', date: '2026-03-21', day: 21, month: 'МАРТ', monthCrh: 'МАРТ',
    title: 'Навруз', titleCrh: 'Навруз',
    description: 'Крымскотатарский праздник весеннего равноденствия, начало нового года',
    descriptionCrh: 'Къырымтатарларнынъ весенги кун тенгленув байрамы, янъы йыл башы',
    type: 'holiday',
  },
  {
    id: '2', date: '2026-05-18', day: 18, month: 'МАЙ', monthCrh: 'МАЙЫС',
    title: 'День памяти жертв депортации', titleCrh: 'Сюргунлик къурбанларыны хатырлау куню',
    description: 'Общегородской молебен и мероприятия. День памяти жертв депортации крымских татар 1944 года',
    descriptionCrh: 'Шеерлыкъ дуа ве чаралар. 1944 йылдаки сюргуннинъ хатырасы',
    type: 'memorial',
  },
  {
    id: '3', date: '2026-05-06', day: 6, month: 'МАЙ', monthCrh: 'МАЙЫС',
    title: 'Хыдырлез', titleCrh: 'Хыдырлез',
    description: 'Традиционный праздник, отмечается 6 мая. Праздник плодородия и изобилия',
    descriptionCrh: 'Адеет байрам, 6 майыста тутылыр. Берекет байрамы',
    type: 'holiday',
  },
  {
    id: '4', date: '2026-09-22', day: 22, month: 'СЕНТЯБРЬ', monthCrh: 'СЕНТЯБРЬ',
    title: 'Дервиза', titleCrh: 'Дервиза',
    description: 'Осенний праздник в день осеннего равноденствия. Подведение итогов труда',
    descriptionCrh: 'Кузь байрамы, кузь кун тенгленув куню тутылыр',
    type: 'holiday',
  },
  {
    id: '5', date: '2026-06-26', day: 26, month: 'ИЮНЬ', monthCrh: 'ИЙЮНЬ',
    title: 'Курбан байрам', titleCrh: 'Къурбан байрамы',
    description: 'Один из главных праздников мусульман. Жертвоприношение и милостыня',
    descriptionCrh: 'Мусулманларнынъ эсас байрамы. Къурбанлыкъ ве садака',
    type: 'holiday',
  },
  {
    id: '6', date: '2026-04-21', day: 21, month: 'АПРЕЛЬ', monthCrh: 'АПРЕЛЬ',
    title: 'Ораза байрам', titleCrh: 'Ораза байрамы',
    description: 'Праздник разговения после месяца Рамазан. Милостыня и прощение',
    descriptionCrh: 'Рамазан айы сонърасы ачув байрамы',
    type: 'holiday',
  },
];

export function getUpcomingEvents(count = 3): EthnoEvent[] {
  const today = new Date();
  return ethnoEvents
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, count);
}

export function getEventByDate(date: string): EthnoEvent | undefined {
  return ethnoEvents.find(e => e.date === date);
}
