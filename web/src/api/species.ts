export interface SpeciesOption {
  key: string;
  emoji: string;
  keywords: string[];
}

export const SPECIES_OPTIONS: SpeciesOption[] = [
  { key: 'bee', emoji: '🐝', keywords: ['abelha', 'bee'] },
  { key: 'spider', emoji: '🕷️', keywords: ['aranha', 'spider', 'tarântula', 'tarantula'] },
  { key: 'butterfly', emoji: '🦋', keywords: ['borboleta', 'butterfly'] },
  { key: 'goat', emoji: '🐐', keywords: ['cabra', 'goat'] },
  { key: 'dog', emoji: '🐶', keywords: ['cach', 'dog', 'cão', 'cao'] },
  { key: 'shrimp', emoji: '🦐', keywords: ['camarão', 'camarao', 'shrimp'] },
  { key: 'crab', emoji: '🦀', keywords: ['caranguejo', 'crab'] },
  { key: 'horse', emoji: '🐴', keywords: ['cavalo', 'horse', 'pônei', 'ponei', 'pony'] },
  { key: 'chinchilla', emoji: '🐭', keywords: ['chinchila', 'chinchilla'] },
  { key: 'snake', emoji: '🐍', keywords: ['cobra', 'snake', 'serpente'] },
  { key: 'rabbit', emoji: '🐰', keywords: ['coelho', 'rabbit', 'bunny'] },
  { key: 'owl', emoji: '🦉', keywords: ['coruja', 'owl'] },
  { key: 'squirrel', emoji: '🐿️', keywords: ['esquilo', 'squirrel'] },
  { key: 'ferret', emoji: '🦡', keywords: ['furão', 'furao', 'ferret'] },
  { key: 'chicken', emoji: '🐔', keywords: ['galinha', 'chicken', 'galo'] },
  { key: 'cat', emoji: '🐱', keywords: ['gat', 'cat'] },
  { key: 'hamster', emoji: '🐹', keywords: ['hamster'] },
  { key: 'lizard', emoji: '🦎', keywords: ['lagarto', 'lizard', 'iguana'] },
  { key: 'bat', emoji: '🦇', keywords: ['morcego', 'bat'] },
  { key: 'hedgehog', emoji: '🦔', keywords: ['ouriço', 'ourico', 'hedgehog'] },
  { key: 'sheep', emoji: '🐑', keywords: ['ovelha', 'sheep'] },
  { key: 'parrot', emoji: '🦜', keywords: ['papagaio', 'parrot', 'calopsita', 'periquito'] },
  { key: 'bird', emoji: '🐦', keywords: ['pass', 'ave', 'bird'] },
  { key: 'duck', emoji: '🦆', keywords: ['pato', 'duck'] },
  { key: 'peacock', emoji: '🦚', keywords: ['pavão', 'pavao', 'peacock'] },
  { key: 'fish', emoji: '🐠', keywords: ['peixe', 'fish', 'betta'] },
  { key: 'penguin', emoji: '🐧', keywords: ['pinguim', 'penguin'] },
  { key: 'octopus', emoji: '🐙', keywords: ['polvo', 'octopus'] },
  { key: 'pig', emoji: '🐷', keywords: ['porco', 'pig'] },
  { key: 'guineaPig', emoji: '🐹', keywords: ['porquinho', 'guinea'] },
  { key: 'mouse', emoji: '🐭', keywords: ['rato', 'camundongo', 'mouse'] },
  { key: 'frog', emoji: '🐸', keywords: ['sapo', 'rã', 'ra', 'frog'] },
  { key: 'turtle', emoji: '🐢', keywords: ['tartaruga', 'turtle', 'jabuti'] },
  { key: 'cow', emoji: '🐮', keywords: ['vaca', 'cow', 'boi'] },
];

export function speciesEmoji(species: string | null | undefined): string {
  const value = species?.toLowerCase().trim() ?? '';
  if (!value) return '🐾';
  const byKey = SPECIES_OPTIONS.find((option) => option.key === value);
  if (byKey) return byKey.emoji;
  const match = SPECIES_OPTIONS.find((option) =>
    option.keywords.some((keyword) => value.includes(keyword)),
  );
  return match?.emoji ?? '🐾';
}

export function speciesLabel(
  species: string | null | undefined,
  t: (key: string) => string,
): string | null {
  if (!species) return null;
  const byKey = SPECIES_OPTIONS.find((option) => option.key === species);
  return byKey ? t(`species.${byKey.key}`) : species;
}
