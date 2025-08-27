import { describe, expect, it } from 'vitest';

import { formatJsonWithVariables, validateJsonWithVariables } from './jsonUtils';

describe('validateJsonWithVariables', () => {
  it('validates correct JSON with variables', () => {
    const input = '{ "a": {{var1}}, "b": "text", "c": [{{var2}}, 2] }';
    const result = validateJsonWithVariables(input);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('detects malformed variable', () => {
    const input = '{ "a": {{1var}}, "b": {{var_2}}, "c": {{var-3}} }';
    const result = validateJsonWithVariables(input);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.message.includes('mal formatada'))).toBe(true);
  });

  it('detects invalid JSON', () => {
    const input = '{ "a": {{var1}}, "b": [1, 2, }';
    const result = validateJsonWithVariables(input);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.message.startsWith('JSON inválido'))).toBe(true);
  });

  it('returns error position for malformed variable', () => {
    const input = '{ "a": {{1var}} }';
    const result = validateJsonWithVariables(input);
    expect(result.errors[0].line).toBeDefined();
    expect(result.errors[0].column).toBeDefined();
    expect(result.errors[0].startOffset).toBeDefined();
    expect(result.errors[0].endOffset).toBeDefined();
  });

  it('returns error position for JSON error', () => {
    const input = '{ "a": {{var1}}, }';
    const result = validateJsonWithVariables(input);
    expect(
      result.errors.some(e => typeof e.line === 'number' && typeof e.column === 'number')
    ).toBe(true);
  });
});

describe('formatJsonWithVariables', () => {
  it('formats valid JSON with variables', () => {
    const input = '{"a": {{var1}}, "b": "text", "c": [{{var2}}, 2]}';
    const output = formatJsonWithVariables(input);
    expect(output).toContain('{{var1}}');
    expect(output).toContain('{{var2}}');
    expect(output).toContain('"b": "text"');
    expect(output).toMatch(/\s{2}"a": {{var1}},/);
  });

  it('returns original text for invalid JSON', () => {
    const input = '{"a": {{var1}}, }';
    const output = formatJsonWithVariables(input);
    expect(output).toBe(input);
  });

  it('handles multiple variables with similar names', () => {
    const input = '{"a": {{var}}, "b": {{var}}, "c": {{var2}}}';
    const output = formatJsonWithVariables(input);
    expect((output.match(/{{var}}/g) || []).length).toBe(2);
    expect(output).toContain('{{var2}}');
  });
});
