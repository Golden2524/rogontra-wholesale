const catalogueHeaders = [
  'helen_sku',
  'product_name',
  'category',
  'brand',
  'gtin_or_barcode',
  'description',
  'currency',
  'price',
  'available_quantity',
  'weight_kg',
  'length_cm',
  'width_cm',
  'height_cm',
  'primary_image_url',
  'target_jumia_market',
  'listing_approval'
];

const fulfilmentHeaders = [
  'target_marketplace',
  'dispatch_country',
  'dispatch_city',
  'carrier_or_delivery_partner',
  'handling_time_business_days',
  'returns_process_owner'
];

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error('CSV has an unclosed quoted value.');
  values.push(value.trim());
  return values;
}

export function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length === 0) throw new Error('CSV is empty.');

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      throw new Error(`Row ${index + 2} has ${values.length} values; expected ${headers.length}.`);
    }
    return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
  });
}

function requireHeaders(actual, expected, fileLabel) {
  const missing = expected.filter((header) => !actual.includes(header));
  if (missing.length) {
    throw new Error(`${fileLabel} is missing required header(s): ${missing.join(', ')}.`);
  }
}

function isPositiveNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function isWholeNumberAtLeastZero(value) {
  return /^\d+$/.test(value) && Number(value) >= 0;
}

function normalize(value) {
  return value.trim().toLowerCase();
}

export function validateMarketplaceData(catalogueText, fulfilmentText) {
  const catalogueRows = parseCsv(catalogueText);
  const fulfilmentRows = parseCsv(fulfilmentText);
  const catalogueHeader = parseCsvLine(catalogueText.replace(/^\uFEFF/, '').split(/\r?\n/)[0]);
  const fulfilmentHeader = parseCsvLine(fulfilmentText.replace(/^\uFEFF/, '').split(/\r?\n/)[0]);
  requireHeaders(catalogueHeader, catalogueHeaders, 'Catalogue CSV');
  requireHeaders(fulfilmentHeader, fulfilmentHeaders, 'Fulfilment CSV');

  const errors = [];
  const seenSkus = new Set();
  const fulfilmentMarkets = new Set();

  fulfilmentRows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (Object.values(row).every((value) => !value)) return;
    const required = [
      'target_marketplace',
      'dispatch_country',
      'dispatch_city',
      'carrier_or_delivery_partner',
      'returns_process_owner'
    ];
    required.forEach((field) => {
      if (!row[field]) errors.push(`Fulfilment row ${rowNumber}: ${field} is required.`);
    });
    if (!isWholeNumberAtLeastZero(row.handling_time_business_days)) {
      errors.push(
        `Fulfilment row ${rowNumber}: handling_time_business_days must be a whole number.`
      );
    }
    if (row.target_marketplace) fulfilmentMarkets.add(normalize(row.target_marketplace));
  });

  catalogueRows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (Object.values(row).every((value) => !value)) return;
    const approval = normalize(row.listing_approval);
    if (!['not reviewed', 'approved', 'needs changes', 'do not list'].includes(approval)) {
      errors.push(`Catalogue row ${rowNumber}: listing_approval is not supported.`);
      return;
    }
    if (approval !== 'approved') return;

    [
      'helen_sku',
      'product_name',
      'category',
      'description',
      'currency',
      'primary_image_url',
      'target_jumia_market'
    ].forEach((field) => {
      if (!row[field])
        errors.push(`Catalogue row ${rowNumber}: ${field} is required for approval.`);
    });
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,99}$/.test(row.helen_sku)) {
      errors.push(`Catalogue row ${rowNumber}: helen_sku must be 3–100 safe characters.`);
    }
    const normalizedSku = normalize(row.helen_sku);
    if (normalizedSku && seenSkus.has(normalizedSku)) {
      errors.push(`Catalogue row ${rowNumber}: helen_sku duplicates an earlier row.`);
    }
    seenSkus.add(normalizedSku);
    if (normalize(row.currency) !== 'usd') {
      errors.push(
        `Catalogue row ${rowNumber}: currency must be USD until the settlement plan is approved.`
      );
    }
    if (!isPositiveNumber(row.price)) {
      errors.push(`Catalogue row ${rowNumber}: price must be greater than zero.`);
    }
    if (!isWholeNumberAtLeastZero(row.available_quantity)) {
      errors.push(`Catalogue row ${rowNumber}: available_quantity must be a whole number.`);
    }
    ['weight_kg', 'length_cm', 'width_cm', 'height_cm'].forEach((field) => {
      if (!isPositiveNumber(row[field])) {
        errors.push(`Catalogue row ${rowNumber}: ${field} must be greater than zero.`);
      }
    });
    if (row.target_jumia_market && !fulfilmentMarkets.has(normalize(row.target_jumia_market))) {
      errors.push(
        `Catalogue row ${rowNumber}: target_jumia_market has no matching fulfilment row.`
      );
    }
  });

  return {
    errors,
    approvedProducts: catalogueRows.filter((row) => normalize(row.listing_approval) === 'approved')
      .length
  };
}
