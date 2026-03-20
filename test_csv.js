
function parseCSV(csvText, separator = ';') {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    let headerLine = lines[0];
    if (headerLine.startsWith('\uFEFF')) {
        headerLine = headerLine.substring(1);
    }

    let actualSeparator = separator;
    if (!headerLine.includes(separator) && headerLine.includes(',')) {
        actualSeparator = ',';
    }

    const headers = headerLine.split(actualSeparator).map(h => h.trim().toLowerCase());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(actualSeparator);
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] !== undefined ? values[index].trim() : '';
        });
        result.push(obj);
    }

    return result;
}

function test(name, csv, expectedCount, expectedFirstDni) {
    console.log(`--- Test: ${name} ---`);
    try {
        const result = parseCSV(csv);
        console.log(`Count: ${result.length} (Expected: ${expectedCount})`);
        if (result.length > 0) {
            console.log(`First row DNI: "${result[0].dni}" (Expected: "${expectedFirstDni}")`);
            console.log(`First row keys: ${Object.keys(result[0]).join(', ')}`);
        }
        const success = result.length === expectedCount && (result.length === 0 || result[0].dni === expectedFirstDni);
        console.log(success ? "PASS" : "FAIL");
    } catch (e) {
        console.error("ERROR:", e);
    }
    console.log("");
}

// 1. Normal Semicolon
test("Normal Semicolon", "dni;nombre\n123;Juan", 1, "123");

// 2. Comma (Auto-detect)
test("Comma Auto-detect", "dni,nombre\n456,Maria", 1, "456");

// 3. UTF-8 BOM
test("BOM Handling", "\uFEFFdni;nombre\n789;Pedro", 1, "789");

// 4. Missing value
test("Missing Value", "dni;nombre\n;Incompleto", 1, "");

// 5. Mixed Case Headers
test("Case Sensitivity", "DNI;Nombre\n111;Test", 1, "111");

// 6. Extra spaces
test("Extra Spaces", " dni ; nombre \n 222 ; Spaced ", 1, "222");
