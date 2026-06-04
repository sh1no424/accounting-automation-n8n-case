function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;

  const normalized = String(value)
    .replace(/\s/g, '')
    .replace(',', '.');

  const number = Number(normalized);

  return Number.isNaN(number) ? null : number;
}

function validateAmounts(document) {
  const errors = [];

  const sumWithoutVat = toNumber(document.amounts?.sum_without_vat);
  const vatSum = toNumber(document.amounts?.vat_sum);
  const totalSum = toNumber(document.amounts?.total_sum);

  if (sumWithoutVat === null || vatSum === null || totalSum === null) {
    errors.push({
      code: 'amount_required',
      message: 'Не заполнены суммы документа.'
    });

    return errors;
  }

  const calculatedTotal = sumWithoutVat + vatSum;

  if (Math.abs(calculatedTotal - totalSum) > 0.01) {
    errors.push({
      code: 'amount_mismatch',
      message: 'Сумма без НДС + НДС не равна итоговой сумме.'
    });
  }

  return errors;
}

function validateRequiredFields(document) {
  const errors = [];

  if (!document.document?.number) {
    errors.push({
      code: 'document_number_required',
      message: 'Не заполнен номер документа.'
    });
  }

  if (!document.document?.date) {
    errors.push({
      code: 'document_date_required',
      message: 'Не заполнена дата документа.'
    });
  }

  if (!document.supplier?.inn) {
    errors.push({
      code: 'supplier_inn_required',
      message: 'Не заполнен ИНН поставщика.'
    });
  }

  if (!document.buyer?.inn) {
    errors.push({
      code: 'buyer_inn_required',
      message: 'Не заполнен ИНН покупателя.'
    });
  }

  return errors;
}

function validateInnKpp(party, role) {
  const errors = [];

  const inn = String(party?.inn || '').replace(/\D/g, '');
  const kpp = String(party?.kpp || '').replace(/\D/g, '');

  if (![10, 12].includes(inn.length)) {
    errors.push({
      code: `${role}_inn_invalid`,
      message: `ИНН должен содержать 10 или 12 цифр.`
    });
  }

  if (kpp && kpp.length !== 9) {
    errors.push({
      code: `${role}_kpp_invalid`,
      message: `КПП должен содержать 9 цифр.`
    });
  }

  return errors;
}

function validateDocument(document) {
  const errors = [
    ...validateRequiredFields(document),
    ...validateInnKpp(document.supplier, 'supplier'),
    ...validateInnKpp(document.buyer, 'buyer'),
    ...validateAmounts(document)
  ];

  const status = errors.length === 0
    ? 'accepted'
    : 'requires_manual_review';

  return {
    status,
    status_name: status === 'accepted'
      ? 'Принят к учёту'
      : 'Требует ручной проверки',
    errors
  };
}

// Example usage with synthetic data only.
const result = validateDocument($json);

return [
  {
    json: {
      ...$json,
      validation_result: result
    }
  }
];