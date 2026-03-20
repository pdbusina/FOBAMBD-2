/**
 * Utility to parse CSV strings into arrays of objects.
 * Supports ';' as default separator.
 */
export function parseCSV<T>(csvText: string, separator: string = ';'): T[] {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    let headerLine = lines[0];
    // Strip Byte Order Mark (BOM) if present
    if (headerLine.startsWith('\uFEFF')) {
        headerLine = headerLine.substring(1);
    }

    // Auto-detect separator if the default one doesn't seem to be present in the header
    let actualSeparator = separator;
    if (!headerLine.includes(separator) && headerLine.includes(',')) {
        actualSeparator = ',';
    }

    const headers = headerLine.split(actualSeparator).map(h => h.trim().toLowerCase());
    const result: T[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(actualSeparator);
        const obj: any = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] !== undefined ? values[index].trim() : '';
        });
        result.push(obj as T);
    }

    return result;
}
