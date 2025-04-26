const VOICE_TYPES = {
  MIXED: 'mixed',
  SAB: 'sab',
  SATB: 'satb',
  SA: 'sa',
  TB: 'tb'
};

const voicingTypes = {
  'Two-Part Mixed': VOICE_TYPES.MIXED,
  'Three-Part Mixed': VOICE_TYPES.MIXED,
  'SAB': VOICE_TYPES.SAB,
  'SATB': VOICE_TYPES.SATB,
  'SA': VOICE_TYPES.SA,
  'SSA': VOICE_TYPES.SA,
  'SSAA': VOICE_TYPES.SA,
  'TB': VOICE_TYPES.TB,
  'TTB': VOICE_TYPES.TB,
  'TTBB': VOICE_TYPES.TB,
  'Derric Johnson': VOICE_TYPES.SATB,
  'Voctave': VOICE_TYPES.SATB
};

const voiceParts = {
  [VOICE_TYPES.MIXED]: {
    'Two-Part Mixed': ['Part I', 'Part II'],
    'Three-Part Mixed': ['Part I', 'Part II', 'Part III']
  },
  [VOICE_TYPES.SAB]: {
    'SAB': ['Soprano', 'Alto', 'Bass']
  },
  [VOICE_TYPES.SATB]: {
    'SATB': ['Soprano', 'Alto', 'Tenor', 'Bass'],
    'Derric Johnson': ['Soprano', 'Alto', 'Tenor', 'Bass'],
    'Voctave': ['Soprano', 'Alto', 'Tenor', 'Bass']
  },
  [VOICE_TYPES.SA]: {
    'SA': ['Soprano', 'Alto'],
    'SSA': ['Soprano I', 'Soprano II', 'Alto'],
    'SSAA': ['Soprano I', 'Soprano II', 'Alto I', 'Alto II']
  },
  [VOICE_TYPES.TB]: {
    'TB': ['Tenor', 'Bass'],
    'TTB': ['Tenor I', 'Tenor II', 'Bass'],
    'TTBB': ['Tenor I', 'Tenor II', 'Bass I', 'Bass II']
  }
};

export const VOICING_OPTIONS = [
  { id: 'two_part', label: 'Two-Part Mixed' },
  { id: 'three_part_mixed', label: 'Three-Part Mixed' },
  { id: 'sab', label: 'SAB' },
  { id: 'satb', label: 'SATB' },
  { id: 'sa', label: 'SA' },
  { id: 'ssa', label: 'SSA' },
  { id: 'ssaa', label: 'SSAA' },
  { id: 'tb', label: 'TB' },
  { id: 'ttb', label: 'TTB' },
  { id: 'ttbb', label: 'TTBB' },
  { id: 'derric_johnson', label: 'Derric Johnson' },
  { id: 'voctave', label: 'Voctave' }
];

export { voicingTypes, voiceParts, VOICE_TYPES };
