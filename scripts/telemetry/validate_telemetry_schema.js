/**
 * Telemetry Ingestion Payload Schema Validator
 * Authored by Tushar Tiwari (@tiwaritushar02)
 * 
 * Verifies that all recorded click stream events conform to required database types
 */

const requiredFields = [
  { field: 'timestamp', type: 'string' },
  { field: 'country_code', type: 'string', maxLength: 3 },
  { field: 'device_type', type: 'string' },
  { field: 'is_bot', type: 'boolean' },
];

function validateClickEvent(event) {
  const errors = [];

  if (!event || typeof event !== 'object') {
    return { valid: false, errors: ['Event payload must be an object'] };
  }

  for (const rule of requiredFields) {
    const val = event[rule.field];
    if (val === undefined || val === null) {
      errors.push(`Missing mandatory field: ${rule.field}`);
    } else if (typeof val !== rule.type) {
      errors.push(`Invalid type for ${rule.field}: expected ${rule.type}, received ${typeof val}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Self-test assertion block
if (require.main === module) {
  console.log('Testing Telemetry Payload Validator...');
  const sampleEvent = {
    timestamp: new Date().toISOString(),
    country_code: 'IN',
    device_type: 'mobile',
    is_bot: false,
  };
  const result = validateClickEvent(sampleEvent);
  console.log('Sample Event Result:', result.valid ? 'VALID ✓' : 'INVALID ✗');
}

module.exports = { validateClickEvent };
