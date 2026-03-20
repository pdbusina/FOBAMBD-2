/**
 * Utility to parse CSV strings into arrays of objects.
 * Supports ';' as default separator.
 */
export function parseCSV<T>(csvText: string, separator: string = ';'): T[] {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());
    const result: T[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(separator);
        const obj: any = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] ? values[index].trim() : '';
        });
        result.push(obj as T);
    }

    return result;
}
