export const badWords = [
    'anjing', 'babi', 'monyet', 'kunyuk', 'bajingan', 'asu', 'bangsat', 'kampret',
    'ontol', 'tolol', 'bego', 'goblok', 'idiot', 'gila', 'sinting', 'sarap',
    'setan', 'iblis', 'jancuk', 'pantek', 'puki', 'kontol', 'memek', 'ngentot', 
    'bokep', 'porn', 'sex', 'tai', 'telek', 'biadab', 'brengsek', 'keparat',
    // Additional words
    'lonte', 'pelacur', 'perek', 'jablay', 'bencong', 'banci', 'maho',
    'ngewe', 'sange', 'colim', 'coli', 'toket', 'tetek', 'jembut',
    'goblog', 'peju', 'itil', 'njing', 'bgst', 'ajg', 'anying', 'anjir',
    'pantat', 'bugil', 'telanjang', 'homo', 'lesbi', 'sialan', 'bodoh',
    // Sunda words
    'koplok', 'boloho', 'kehed', 'belegug', 'siah', 'bagong', 'bedul',
    'jurig', 'modol', 'podol', 'borokokok', 'gelo', 'nurustunjung', 'bangkawarah', 'lebok'
];

export const containsBadWords = (text: string): boolean => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    // Check for exact word matches or partial matches that are clearly intended as bad words
    // Using simple inclusion for now, but could be Regex for whole word boundary
    return badWords.some(word => lowerText.includes(word));
};
