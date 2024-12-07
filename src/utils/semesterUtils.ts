const termOrder = {
    'SPRING': 0,
    'SUMMER': 1,
    'FALL': 2,
    'WINTER': 3
};

export const compareSemesters = (a: { id: string; name: string }, b: { id: string; name: string }): number => {
    // Extract year and term from semester IDs (e.g., "FALL2024" -> ["FALL", "2024"])
    const [termA, yearA] = [a.id.replace(/([A-Z]+)(\d+)/, '$1'), parseInt(a.id.replace(/([A-Z]+)(\d+)/, '$2'))];
    const [termB, yearB] = [b.id.replace(/([A-Z]+)(\d+)/, '$1'), parseInt(b.id.replace(/([A-Z]+)(\d+)/, '$2'))];

    // Compare years first
    if (yearA !== yearB) {
        return yearA - yearB;
    }

    // If years are the same, compare terms
    return termOrder[termA as keyof typeof termOrder] - termOrder[termB as keyof typeof termOrder];
};