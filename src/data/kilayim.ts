export type Species = {
  id: string;
  hebrewName: string;
  category: 'tree' | 'vegetable' | 'grain' | 'legume';
  alternateNames?: string[];
};

export const SPECIES: Species[] = [
  { id: 'apple', hebrewName: 'תפוח', category: 'tree' },
  { id: 'pear', hebrewName: 'אגס', category: 'tree' },
  { id: 'olive', hebrewName: 'זית', category: 'tree' },
  { id: 'grape', hebrewName: 'גפן', category: 'tree' },
  { id: 'fig', hebrewName: 'תאנה', category: 'tree' },
  { id: 'pomegranate', hebrewName: 'רימון', category: 'tree' },
  { id: 'date', hebrewName: 'תמר', category: 'tree' },
  { id: 'orange', hebrewName: 'תפוז', category: 'tree' },
  { id: 'lemon', hebrewName: 'לימון', category: 'tree' },
  { id: 'almond', hebrewName: 'שקד', category: 'tree' },
  { id: 'tomato', hebrewName: 'עגבניה', category: 'vegetable' },
  { id: 'cucumber', hebrewName: 'מלפפון', category: 'vegetable' },
  { id: 'pepper', hebrewName: 'פלפל', category: 'vegetable' },
  { id: 'potato', hebrewName: 'תפוח אדמה', category: 'vegetable' },
  { id: 'onion', hebrewName: 'בצל', category: 'vegetable' },
  { id: 'lettuce', hebrewName: 'חסה', category: 'vegetable' },
  { id: 'cabbage', hebrewName: 'כרוב', category: 'vegetable' },
  { id: 'wheat', hebrewName: 'חיטה', category: 'grain' },
  { id: 'barley', hebrewName: 'שעורה', category: 'grain' },
  { id: 'corn', hebrewName: 'תירס', category: 'grain' },
  { id: 'rice', hebrewName: 'אורז', category: 'grain' },
  { id: 'bean', hebrewName: 'שעועית', category: 'legume' },
  { id: 'pea', hebrewName: 'אפונה', category: 'legume' },
  { id: 'lentil', hebrewName: 'עדשים', category: 'legume' },
  { id: 'chickpea', hebrewName: 'חומוס', category: 'legume' },
  { id: 'mint', hebrewName: 'נענע', category: 'vegetable' },
  { id: 'parsley', hebrewName: 'פטרוזיליה', category: 'vegetable' },
  { id: 'cilantro', hebrewName: 'כוסברה', category: 'vegetable' },
  { id: 'basil', hebrewName: 'בזיליקום', category: 'vegetable' },
  { id: 'strawberry', hebrewName: 'תות שדה', category: 'vegetable' },
  { id: 'watermelon', hebrewName: 'אבטיח', category: 'vegetable' },
  { id: 'melon', hebrewName: 'מלון', category: 'vegetable' },
];

export type DistanceRule = {
  meters: number;
  description: string;
};

export function distanceBetween(a: Species, b: Species): DistanceRule {
  if (a.id === b.id) return { meters: 0, description: 'אותו מין - אין כלאיים' };

  if (a.category === 'tree' && b.category === 'tree') {
    return {
      meters: 0,
      description: 'בין שני אילני מאכל שונים - אין צורך להרחיק. ויש מחמירים שלשה טפחים (24 ס"מ)',
    };
  }

  if (a.category === 'tree' || b.category === 'tree') {
    return {
      meters: 0,
      description: 'בין אילן לזרעים - אין צורך להרחיק. פרט לגפן שממנה יש להרחיק 6 טפחים (48 ס"מ)',
    };
  }

  if (
    (a.category === 'vegetable' && b.category === 'vegetable') ||
    (a.category === 'vegetable' && b.category === 'legume') ||
    (a.category === 'legume' && b.category === 'vegetable') ||
    (a.category === 'legume' && b.category === 'legume')
  ) {
    return {
      meters: 0.12,
      description: 'בין שני ירקות שונים - טפח וחצי (כ-12 ס"מ)',
    };
  }

  // Grain (or grain mixed with anything else) — including grain-grain — uses
  // the same rule per Rabbi Dvir's review.
  if (a.category === 'grain' || b.category === 'grain') {
    return {
      meters: 0.48,
      description: 'הרחקה בין דגנים או קטניות (ובינם לירקות) – 6 טפחים (48 ס"מ)',
    };
  }

  return { meters: 0.48, description: 'הרחקה בין דגנים או קטניות (ובינם לירקות) – 6 טפחים (48 ס"מ)' };
}

export const KILAY_ILAN_FORBIDDEN: Array<[string, string]> = [
  ['תפוח', 'אגס'],
  ['חבוש', 'אגס'],
  ['שזיף', 'משמש'],
  ['שזיף', 'אפרסק'],
  ['לימון', 'תפוז'],
  ['אתרוג', 'לימון'],
];

export function isKilayIlanForbidden(a: Species, b: Species): boolean {
  return KILAY_ILAN_FORBIDDEN.some(
    ([x, y]) =>
      (a.hebrewName === x && b.hebrewName === y) || (a.hebrewName === y && b.hebrewName === x),
  );
}
