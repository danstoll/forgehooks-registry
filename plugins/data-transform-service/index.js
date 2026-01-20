/**
 * Data Transform Service - Embedded ForgeHook
 * 
 * Comprehensive data transformation operations for JSON, CSV, XML, YAML.
 * Pure JavaScript implementation with zero external dependencies.
 * 
 * @version 1.0.0
 * @license MIT
 */

// ============================================================================
// JSON PATH & QUERY
// ============================================================================

/**
 * Query JSON data using JSONPath expression
 * Supports: $, ., .., *, [], [n], [n:m], [*], @, ()
 * @param {any} data - JSON data to query
 * @param {string} query - JSONPath expression
 * @returns {any} Query results
 */
function jsonQuery(data, query) {
  if (!query || query === '$') return data;
  
  // Normalize the path
  let path = query
    .replace(/\$\.?/, '')           // Remove leading $
    .replace(/\[(\d+)\]/g, '.$1')   // [0] -> .0
    .replace(/\[['"]([^'"]+)['"]\]/g, '.$1'); // ['key'] -> .key
  
  // Handle recursive descent (..)
  if (path.includes('..')) {
    return _recursiveQuery(data, path);
  }
  
  // Handle wildcards
  if (path.includes('*')) {
    return _wildcardQuery(data, path);
  }
  
  // Simple path traversal
  const parts = path.split('.').filter(p => p);
  let result = data;
  
  for (const part of parts) {
    if (result === undefined || result === null) return undefined;
    
    // Array slice [start:end]
    const sliceMatch = part.match(/^(\d*):(\d*)$/);
    if (sliceMatch && Array.isArray(result)) {
      const start = sliceMatch[1] ? parseInt(sliceMatch[1]) : 0;
      const end = sliceMatch[2] ? parseInt(sliceMatch[2]) : result.length;
      return result.slice(start, end);
    }
    
    result = result[part];
  }
  
  return result;
}

function _recursiveQuery(data, path) {
  const results = [];
  const targetKey = path.split('..').pop().replace(/^\./, '');
  
  function search(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
      obj.forEach(item => search(item));
    } else {
      for (const [key, value] of Object.entries(obj)) {
        if (key === targetKey || targetKey === '*') {
          results.push(value);
        }
        search(value);
      }
    }
  }
  
  search(data);
  return results;
}

function _wildcardQuery(data, path) {
  const parts = path.split('.');
  let results = [data];
  
  for (const part of parts) {
    if (!part) continue;
    
    const newResults = [];
    for (const item of results) {
      if (item === null || item === undefined) continue;
      
      if (part === '*') {
        if (Array.isArray(item)) {
          newResults.push(...item);
        } else if (typeof item === 'object') {
          newResults.push(...Object.values(item));
        }
      } else {
        const value = item[part];
        if (value !== undefined) newResults.push(value);
      }
    }
    results = newResults;
  }
  
  return results;
}

/**
 * Transform JSON using a mapping template
 * @param {object} data - Source data
 * @param {object} template - Template with {{path}} placeholders
 * @returns {object} Transformed object
 */
function jsonTransform(data, template) {
  if (typeof template === 'string') {
    return _interpolate(template, data);
  }
  
  if (Array.isArray(template)) {
    return template.map(item => jsonTransform(data, item));
  }
  
  if (typeof template === 'object' && template !== null) {
    const result = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = jsonTransform(data, value);
    }
    return result;
  }
  
  return template;
}

function _interpolate(str, data) {
  return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = get(data, path.trim());
    return value !== undefined ? value : match;
  });
}

// ============================================================================
// CSV FUNCTIONS
// ============================================================================

/**
 * Parse CSV string to array of objects
 * @param {string} data - CSV string
 * @param {object} options - { delimiter, header, skipEmpty, trim }
 * @returns {array} Array of objects or arrays
 */
function csvParse(data, options = {}) {
  const {
    delimiter = ',',
    header = true,
    skipEmpty = true,
    trim = true,
    quote = '"'
  } = options;
  
  const lines = _parseCSVLines(data, delimiter, quote);
  
  if (skipEmpty) {
    lines.filter(line => line.some(cell => cell.length > 0));
  }
  
  if (trim) {
    lines.forEach(line => {
      line.forEach((cell, i) => {
        line[i] = cell.trim();
      });
    });
  }
  
  if (!header) return lines;
  
  const headers = lines[0];
  const rows = lines.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] !== undefined ? row[i] : '';
    });
    return obj;
  });
}

function _parseCSVLines(data, delimiter, quote) {
  const lines = [];
  let currentLine = [];
  let currentCell = '';
  let inQuotes = false;
  
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    const nextChar = data[i + 1];
    
    if (inQuotes) {
      if (char === quote && nextChar === quote) {
        currentCell += quote;
        i++;
      } else if (char === quote) {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === quote) {
        inQuotes = true;
      } else if (char === delimiter) {
        currentLine.push(currentCell);
        currentCell = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentLine.push(currentCell);
        lines.push(currentLine);
        currentLine = [];
        currentCell = '';
        if (char === '\r') i++;
      } else if (char !== '\r') {
        currentCell += char;
      }
    }
  }
  
  // Don't forget the last line
  if (currentCell || currentLine.length > 0) {
    currentLine.push(currentCell);
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Generate CSV string from array of objects
 * @param {array} data - Array of objects
 * @param {object} options - { delimiter, header, columns }
 * @returns {string} CSV string
 */
function csvGenerate(data, options = {}) {
  if (!Array.isArray(data) || data.length === 0) return '';
  
  const {
    delimiter = ',',
    header = true,
    columns = null,
    quote = '"',
    lineEnding = '\n'
  } = options;
  
  const headers = columns || Object.keys(data[0]);
  const lines = [];
  
  if (header) {
    lines.push(headers.map(h => _escapeCSVField(h, delimiter, quote)).join(delimiter));
  }
  
  for (const row of data) {
    const line = headers.map(h => {
      const value = row[h];
      return _escapeCSVField(value !== undefined ? String(value) : '', delimiter, quote);
    });
    lines.push(line.join(delimiter));
  }
  
  return lines.join(lineEnding);
}

function _escapeCSVField(value, delimiter, quote) {
  if (value.includes(quote) || value.includes(delimiter) || value.includes('\n') || value.includes('\r')) {
    return quote + value.replace(new RegExp(quote, 'g'), quote + quote) + quote;
  }
  return value;
}

// ============================================================================
// XML FUNCTIONS
// ============================================================================

/**
 * Parse XML string to JSON object
 * @param {string} data - XML string
 * @param {object} options - { preserveAttributes, attributePrefix }
 * @returns {object} JSON representation
 */
function xmlParse(data, options = {}) {
  const { 
    preserveAttributes = true, 
    attributePrefix = '@',
    textKey = '#text'
  } = options;
  
  // Remove XML declaration and comments
  let xml = data
    .replace(/<\?xml[^?]*\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
  
  function parseNode(str) {
    str = str.trim();
    if (!str) return null;
    
    // Match opening tag
    const tagMatch = str.match(/^<(\w+)([^>]*)>/);
    if (!tagMatch) {
      // Text content
      return _decodeXMLEntities(str);
    }
    
    const tagName = tagMatch[1];
    const attrStr = tagMatch[2];
    
    // Parse attributes
    const attributes = {};
    if (preserveAttributes && attrStr) {
      const attrRegex = /(\w+)=["']([^"']*)["']/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
        attributes[attributePrefix + attrMatch[1]] = attrMatch[2];
      }
    }
    
    // Self-closing tag
    if (attrStr.endsWith('/') || str.match(new RegExp(`^<${tagName}[^>]*/>`))) {
      return Object.keys(attributes).length > 0 ? attributes : '';
    }
    
    // Find closing tag
    const closeTag = `</${tagName}>`;
    const closeIndex = _findMatchingCloseTag(str, tagName);
    
    if (closeIndex === -1) {
      throw new Error(`Missing closing tag for ${tagName}`);
    }
    
    const innerContent = str.slice(tagMatch[0].length, closeIndex).trim();
    
    // Parse inner content
    if (!innerContent) {
      return Object.keys(attributes).length > 0 ? attributes : '';
    }
    
    // Check if it's just text
    if (!innerContent.includes('<')) {
      const result = { ...attributes };
      if (Object.keys(attributes).length > 0) {
        result[textKey] = _decodeXMLEntities(innerContent);
      } else {
        return _decodeXMLEntities(innerContent);
      }
      return result;
    }
    
    // Parse child elements
    const result = { ...attributes };
    const children = _parseChildren(innerContent);
    
    for (const child of children) {
      if (typeof child === 'string') {
        if (child.trim()) {
          result[textKey] = child.trim();
        }
        continue;
      }
      
      const [childName, childValue] = Object.entries(child)[0];
      
      if (result[childName] !== undefined) {
        if (!Array.isArray(result[childName])) {
          result[childName] = [result[childName]];
        }
        result[childName].push(childValue);
      } else {
        result[childName] = childValue;
      }
    }
    
    return result;
  }
  
  function _findMatchingCloseTag(str, tagName) {
    let depth = 1;
    const openTag = new RegExp(`<${tagName}(\\s|>|/>)`, 'g');
    const closeTag = new RegExp(`</${tagName}>`, 'g');
    
    let pos = str.indexOf('>') + 1;
    
    while (depth > 0 && pos < str.length) {
      const nextOpen = str.slice(pos).search(openTag);
      const nextClose = str.slice(pos).search(closeTag);
      
      if (nextClose === -1) return -1;
      
      if (nextOpen !== -1 && nextOpen < nextClose) {
        const selfClosing = str.slice(pos + nextOpen).match(new RegExp(`^<${tagName}[^>]*/>`));
        if (!selfClosing) depth++;
        pos += nextOpen + 1;
      } else {
        depth--;
        if (depth === 0) return pos + nextClose;
        pos += nextClose + 1;
      }
    }
    
    return -1;
  }
  
  function _parseChildren(content) {
    const children = [];
    let remaining = content;
    
    while (remaining.trim()) {
      remaining = remaining.trim();
      
      // Text before next tag
      const nextTag = remaining.indexOf('<');
      if (nextTag === -1) {
        children.push(remaining);
        break;
      }
      
      if (nextTag > 0) {
        children.push(remaining.slice(0, nextTag));
        remaining = remaining.slice(nextTag);
        continue;
      }
      
      // Parse tag
      const tagMatch = remaining.match(/^<(\w+)/);
      if (!tagMatch) break;
      
      const tagName = tagMatch[1];
      const closeIndex = _findMatchingCloseTag(remaining, tagName);
      
      if (closeIndex === -1) {
        // Self-closing
        const selfClose = remaining.match(new RegExp(`^<${tagName}[^>]*/>`));
        if (selfClose) {
          children.push({ [tagName]: parseNode(selfClose[0]) });
          remaining = remaining.slice(selfClose[0].length);
          continue;
        }
        break;
      }
      
      const fullTag = remaining.slice(0, closeIndex + `</${tagName}>`.length);
      children.push({ [tagName]: parseNode(fullTag) });
      remaining = remaining.slice(fullTag.length);
    }
    
    return children;
  }
  
  // Find root element
  const rootMatch = xml.match(/^<(\w+)/);
  if (!rootMatch) {
    throw new Error('Invalid XML: no root element found');
  }
  
  const rootName = rootMatch[1];
  return { [rootName]: parseNode(xml) };
}

function _decodeXMLEntities(str) {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

function _encodeXMLEntities(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate XML string from JSON object
 * @param {object} data - JSON object
 * @param {object} options - { rootName, declaration, indent }
 * @returns {string} XML string
 */
function xmlGenerate(data, options = {}) {
  const {
    rootName = 'root',
    declaration = true,
    indent = 2,
    attributePrefix = '@',
    textKey = '#text'
  } = options;
  
  function toXML(obj, name, level = 0) {
    const padding = ' '.repeat(level * indent);
    
    if (obj === null || obj === undefined) {
      return `${padding}<${name}/>`;
    }
    
    if (typeof obj !== 'object') {
      return `${padding}<${name}>${_encodeXMLEntities(obj)}</${name}>`;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => toXML(item, name, level)).join('\n');
    }
    
    // Extract attributes and children
    const attrs = [];
    const children = [];
    let textContent = null;
    
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith(attributePrefix)) {
        attrs.push(`${key.slice(1)}="${_encodeXMLEntities(value)}"`);
      } else if (key === textKey) {
        textContent = value;
      } else {
        children.push({ key, value });
      }
    }
    
    const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
    
    if (children.length === 0 && textContent === null) {
      return `${padding}<${name}${attrStr}/>`;
    }
    
    if (children.length === 0 && textContent !== null) {
      return `${padding}<${name}${attrStr}>${_encodeXMLEntities(textContent)}</${name}>`;
    }
    
    let xml = `${padding}<${name}${attrStr}>`;
    
    if (textContent !== null) {
      xml += _encodeXMLEntities(textContent);
    }
    
    xml += '\n';
    
    for (const { key, value } of children) {
      xml += toXML(value, key, level + 1) + '\n';
    }
    
    xml += `${padding}</${name}>`;
    
    return xml;
  }
  
  let xml = '';
  
  if (declaration) {
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  }
  
  // If data has single root key, use it
  const keys = Object.keys(data);
  if (keys.length === 1) {
    xml += toXML(data[keys[0]], keys[0]);
  } else {
    xml += toXML(data, rootName);
  }
  
  return xml;
}

// ============================================================================
// YAML FUNCTIONS (Simple implementation)
// ============================================================================

/**
 * Parse YAML string to JSON (simple subset)
 * @param {string} data - YAML string
 * @returns {any} Parsed JSON
 */
function yamlParse(data) {
  const lines = data.split('\n');
  const result = {};
  const stack = [{ obj: result, indent: -1 }];
  
  for (let line of lines) {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) continue;
    
    const indent = line.search(/\S/);
    line = line.trim();
    
    // Pop stack for lower indentation
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    
    const current = stack[stack.length - 1].obj;
    
    // Array item
    if (line.startsWith('- ')) {
      const value = line.slice(2).trim();
      if (!Array.isArray(current)) {
        // Convert current object's last key to array
        const parent = stack.length > 1 ? stack[stack.length - 2].obj : result;
        const keys = Object.keys(parent);
        const lastKey = keys[keys.length - 1];
        parent[lastKey] = [];
        stack[stack.length - 1].obj = parent[lastKey];
      }
      current.push(_parseYAMLValue(value));
      continue;
    }
    
    // Key-value pair
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      
      if (value) {
        current[key] = _parseYAMLValue(value);
      } else {
        // Nested object
        current[key] = {};
        stack.push({ obj: current[key], indent });
      }
    }
  }
  
  return result;
}

function _parseYAMLValue(value) {
  if (value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!isNaN(value) && value !== '') return Number(value);
  
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  
  return value;
}

/**
 * Generate YAML string from JSON
 * @param {any} data - JSON data
 * @param {object} options - { indent }
 * @returns {string} YAML string
 */
function yamlGenerate(data, options = {}) {
  const { indent = 2 } = options;
  
  function toYAML(obj, level = 0) {
    const padding = ' '.repeat(level * indent);
    
    if (obj === null) return 'null';
    if (typeof obj === 'boolean') return obj ? 'true' : 'false';
    if (typeof obj === 'number') return String(obj);
    if (typeof obj === 'string') {
      if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
        return `"${obj.replace(/"/g, '\\"')}"`;
      }
      return obj;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return obj.map(item => {
        const value = toYAML(item, level + 1);
        if (typeof item === 'object' && item !== null) {
          return `${padding}- \n${value.split('\n').map(l => padding + '  ' + l.trim()).join('\n')}`;
        }
        return `${padding}- ${value}`;
      }).join('\n');
    }
    
    if (typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (entries.length === 0) return '{}';
      return entries.map(([key, value]) => {
        const yamlValue = toYAML(value, level + 1);
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return `${padding}${key}:\n${yamlValue}`;
        }
        if (Array.isArray(value)) {
          return `${padding}${key}:\n${yamlValue}`;
        }
        return `${padding}${key}: ${yamlValue}`;
      }).join('\n');
    }
    
    return String(obj);
  }
  
  return toYAML(data);
}

// ============================================================================
// JSON SCHEMA VALIDATION
// ============================================================================

/**
 * Validate data against a JSON Schema (subset implementation)
 * @param {any} data - Data to validate
 * @param {object} schema - JSON Schema
 * @returns {object} { valid, errors }
 */
function validate(data, schema) {
  const errors = [];
  
  function _validate(value, schemaObj, path = '$') {
    if (!schemaObj || typeof schemaObj !== 'object') return;
    
    // Type check
    if (schemaObj.type) {
      const types = Array.isArray(schemaObj.type) ? schemaObj.type : [schemaObj.type];
      const actualType = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
      
      if (!types.includes(actualType) && !(actualType === 'number' && types.includes('integer') && Number.isInteger(value))) {
        errors.push({ path, message: `Expected type ${types.join('|')}, got ${actualType}` });
      }
    }
    
    // Enum
    if (schemaObj.enum && !schemaObj.enum.includes(value)) {
      errors.push({ path, message: `Value must be one of: ${schemaObj.enum.join(', ')}` });
    }
    
    // String validations
    if (typeof value === 'string') {
      if (schemaObj.minLength !== undefined && value.length < schemaObj.minLength) {
        errors.push({ path, message: `String length must be >= ${schemaObj.minLength}` });
      }
      if (schemaObj.maxLength !== undefined && value.length > schemaObj.maxLength) {
        errors.push({ path, message: `String length must be <= ${schemaObj.maxLength}` });
      }
      if (schemaObj.pattern && !new RegExp(schemaObj.pattern).test(value)) {
        errors.push({ path, message: `String must match pattern: ${schemaObj.pattern}` });
      }
    }
    
    // Number validations
    if (typeof value === 'number') {
      if (schemaObj.minimum !== undefined && value < schemaObj.minimum) {
        errors.push({ path, message: `Number must be >= ${schemaObj.minimum}` });
      }
      if (schemaObj.maximum !== undefined && value > schemaObj.maximum) {
        errors.push({ path, message: `Number must be <= ${schemaObj.maximum}` });
      }
    }
    
    // Array validations
    if (Array.isArray(value)) {
      if (schemaObj.minItems !== undefined && value.length < schemaObj.minItems) {
        errors.push({ path, message: `Array must have >= ${schemaObj.minItems} items` });
      }
      if (schemaObj.maxItems !== undefined && value.length > schemaObj.maxItems) {
        errors.push({ path, message: `Array must have <= ${schemaObj.maxItems} items` });
      }
      if (schemaObj.items) {
        value.forEach((item, index) => {
          _validate(item, schemaObj.items, `${path}[${index}]`);
        });
      }
    }
    
    // Object validations
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Required properties
      if (schemaObj.required) {
        for (const prop of schemaObj.required) {
          if (!(prop in value)) {
            errors.push({ path: `${path}.${prop}`, message: `Required property missing` });
          }
        }
      }
      
      // Property validations
      if (schemaObj.properties) {
        for (const [prop, propSchema] of Object.entries(schemaObj.properties)) {
          if (prop in value) {
            _validate(value[prop], propSchema, `${path}.${prop}`);
          }
        }
      }
      
      // Additional properties
      if (schemaObj.additionalProperties === false) {
        const allowedProps = Object.keys(schemaObj.properties || {});
        for (const prop of Object.keys(value)) {
          if (!allowedProps.includes(prop)) {
            errors.push({ path: `${path}.${prop}`, message: `Additional property not allowed` });
          }
        }
      }
    }
  }
  
  _validate(data, schema);
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// OBJECT MANIPULATION
// ============================================================================

/**
 * Flatten nested object to dot notation
 * @param {object} data - Nested object
 * @param {string} delimiter - Path delimiter
 * @param {number} maxDepth - Maximum depth
 * @returns {object} Flattened object
 */
function flatten(data, delimiter = '.', maxDepth = 100) {
  const result = {};
  
  function _flatten(obj, prefix = '', depth = 0) {
    if (depth > maxDepth) return;
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}${delimiter}${key}` : key;
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        _flatten(value, newKey, depth + 1);
      } else {
        result[newKey] = value;
      }
    }
  }
  
  _flatten(data);
  return result;
}

/**
 * Unflatten dot notation to nested object
 * @param {object} data - Flattened object
 * @param {string} delimiter - Path delimiter
 * @returns {object} Nested object
 */
function unflatten(data, delimiter = '.') {
  const result = {};
  
  for (const [key, value] of Object.entries(data)) {
    set(result, key.split(delimiter).join('.'), value);
  }
  
  return result;
}

/**
 * Deep merge multiple objects
 * @param {array} objects - Objects to merge
 * @param {object} options - { arrayMerge }
 * @returns {object} Merged object
 */
function merge(objects, options = {}) {
  const { arrayMerge = 'replace' } = options;
  
  function _merge(target, source) {
    const result = { ...target };
    
    for (const [key, value] of Object.entries(source)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = _merge(result[key] || {}, value);
      } else if (Array.isArray(value) && Array.isArray(result[key])) {
        switch (arrayMerge) {
          case 'concat':
            result[key] = [...result[key], ...value];
            break;
          case 'union':
            result[key] = [...new Set([...result[key], ...value])];
            break;
          default:
            result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  return objects.reduce((acc, obj) => _merge(acc, obj), {});
}

/**
 * Pick specific keys from an object
 */
function pick(data, keys) {
  const result = {};
  for (const key of keys) {
    if (key in data) {
      result[key] = data[key];
    }
  }
  return result;
}

/**
 * Omit specific keys from an object
 */
function omit(data, keys) {
  const result = { ...data };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Get value at path with optional default
 */
function get(data, path, defaultValue = undefined) {
  const parts = String(path).split('.');
  let result = data;
  
  for (const part of parts) {
    if (result === null || result === undefined) return defaultValue;
    result = result[part];
  }
  
  return result !== undefined ? result : defaultValue;
}

/**
 * Set value at path
 */
function set(data, path, value) {
  const parts = String(path).split('.');
  let current = data;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = /^\d+$/.test(nextPart) ? [] : {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
  return data;
}

/**
 * Group array by key
 */
function groupBy(data, key) {
  return data.reduce((acc, item) => {
    const groupKey = item[key];
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {});
}

/**
 * Sort array by keys
 */
function sortBy(data, keys) {
  return [...data].sort((a, b) => {
    for (const key of keys) {
      const desc = key.startsWith('-');
      const actualKey = desc ? key.slice(1) : key;
      
      const aVal = a[actualKey];
      const bVal = b[actualKey];
      
      if (aVal < bVal) return desc ? 1 : -1;
      if (aVal > bVal) return desc ? -1 : 1;
    }
    return 0;
  });
}

/**
 * Get unique values
 */
function unique(data, key = null) {
  if (!key) {
    return [...new Set(data)];
  }
  
  const seen = new Set();
  return data.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

/**
 * Rename object keys
 */
function mapKeys(data, mapping) {
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    const newKey = mapping[key] || key;
    result[newKey] = value;
  }
  return result;
}

/**
 * Transform values
 */
function mapValues(data, transforms) {
  const result = { ...data };
  
  const transformFns = {
    uppercase: v => String(v).toUpperCase(),
    lowercase: v => String(v).toLowerCase(),
    trim: v => String(v).trim(),
    number: v => Number(v),
    string: v => String(v),
    boolean: v => Boolean(v),
    json: v => JSON.stringify(v),
    parse: v => JSON.parse(v)
  };
  
  for (const [key, transform] of Object.entries(transforms)) {
    if (key in result && transformFns[transform]) {
      result[key] = transformFns[transform](result[key]);
    }
  }
  
  return result;
}

/**
 * Render template string
 */
function template(templateStr, data) {
  return templateStr.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = get(data, path.trim());
    return value !== undefined ? value : '';
  });
}

/**
 * Calculate object differences
 */
function diff(original, modified) {
  const added = {};
  const removed = {};
  const changed = {};
  
  // Find added and changed
  for (const [key, value] of Object.entries(modified)) {
    if (!(key in original)) {
      added[key] = value;
    } else if (JSON.stringify(original[key]) !== JSON.stringify(value)) {
      changed[key] = { from: original[key], to: value };
    }
  }
  
  // Find removed
  for (const key of Object.keys(original)) {
    if (!(key in modified)) {
      removed[key] = original[key];
    }
  }
  
  return { added, removed, changed };
}

/**
 * Deep clone
 */
function clone(data) {
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(item => clone(item));
  
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = clone(value);
  }
  return result;
}

// ============================================================================
// URL & ENCODING FUNCTIONS
// ============================================================================

/**
 * URL encode a string
 * @param {string} data - String to encode
 * @returns {string} URL encoded string
 */
function urlEncode(data) {
  return encodeURIComponent(String(data));
}

/**
 * URL decode a string
 * @param {string} data - URL encoded string
 * @returns {string} Decoded string
 */
function urlDecode(data) {
  return decodeURIComponent(String(data));
}

/**
 * Parse URL query string to object
 * @param {string} queryString - Query string (with or without leading ?)
 * @returns {object} Parsed parameters
 */
function queryStringParse(queryString) {
  const result = {};
  const str = queryString.startsWith('?') ? queryString.slice(1) : queryString;
  
  if (!str) return result;
  
  for (const pair of str.split('&')) {
    const [key, value] = pair.split('=').map(decodeURIComponent);
    
    if (key in result) {
      if (!Array.isArray(result[key])) {
        result[key] = [result[key]];
      }
      result[key].push(value || '');
    } else {
      result[key] = value || '';
    }
  }
  
  return result;
}

/**
 * Convert object to URL query string
 * @param {object} data - Object to convert
 * @param {object} options - { arrayFormat: 'repeat'|'brackets'|'indices' }
 * @returns {string} Query string (without leading ?)
 */
function queryStringStringify(data, options = {}) {
  const { arrayFormat = 'repeat' } = options;
  const parts = [];
  
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        let k;
        switch (arrayFormat) {
          case 'brackets':
            k = `${key}[]`;
            break;
          case 'indices':
            k = `${key}[${i}]`;
            break;
          default:
            k = key;
        }
        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(value[i])}`);
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  
  return parts.join('&');
}

/**
 * Encode HTML entities
 * @param {string} data - String to encode
 * @returns {string} HTML encoded string
 */
function htmlEncode(data) {
  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return String(data).replace(/[&<>"'`=/]/g, char => entities[char]);
}

/**
 * Decode HTML entities
 * @param {string} data - HTML encoded string
 * @returns {string} Decoded string
 */
function htmlDecode(data) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
    '&nbsp;': ' '
  };
  
  return String(data).replace(/&(?:amp|lt|gt|quot|#39|#x27|#x2F|#x60|#x3D|nbsp);/g, 
    entity => entities[entity] || entity);
}

// ============================================================================
// STRING CASE CONVERSION
// ============================================================================

/**
 * Convert string to camelCase
 * @param {string} str - Input string
 * @returns {string} camelCase string
 */
function camelCase(str) {
  return String(str)
    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
    .replace(/^[A-Z]/, c => c.toLowerCase());
}

/**
 * Convert string to PascalCase
 * @param {string} str - Input string
 * @returns {string} PascalCase string
 */
function pascalCase(str) {
  const camel = camelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Convert string to snake_case
 * @param {string} str - Input string
 * @returns {string} snake_case string
 */
function snakeCase(str) {
  return String(str)
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

/**
 * Convert string to kebab-case
 * @param {string} str - Input string
 * @returns {string} kebab-case string
 */
function kebabCase(str) {
  return String(str)
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

/**
 * Convert string to CONSTANT_CASE
 * @param {string} str - Input string
 * @returns {string} CONSTANT_CASE string
 */
function constantCase(str) {
  return snakeCase(str).toUpperCase();
}

/**
 * Convert string to Title Case
 * @param {string} str - Input string
 * @returns {string} Title Case string
 */
function titleCase(str) {
  return String(str)
    .toLowerCase()
    .replace(/(?:^|\s|[-_])\w/g, c => c.toUpperCase())
    .replace(/[-_]/g, ' ');
}

/**
 * Convert string to URL-safe slug
 * @param {string} str - Input string
 * @param {object} options - { separator, lowercase }
 * @returns {string} URL slug
 */
function slugify(str, options = {}) {
  const { separator = '-', lowercase = true } = options;
  
  let slug = String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, '')        // Remove non-word chars
    .trim()
    .replace(/[\s_]+/g, separator)   // Replace spaces/underscores
    .replace(new RegExp(`${separator}+`, 'g'), separator); // Remove duplicate separators
  
  return lowercase ? slug.toLowerCase() : slug;
}

// ============================================================================
// ARRAY OPERATIONS
// ============================================================================

/**
 * Split array into chunks
 * @param {array} data - Array to chunk
 * @param {number} size - Chunk size
 * @returns {array} Array of chunks
 */
function chunk(data, size) {
  if (!size || size < 1) throw new Error('Chunk size must be positive');
  
  const chunks = [];
  for (let i = 0; i < data.length; i += size) {
    chunks.push(data.slice(i, i + size));
  }
  return chunks;
}

/**
 * Combine arrays element-wise
 * @param {...array} arrays - Arrays to zip
 * @returns {array} Array of tuples
 */
function zip(...arrays) {
  const maxLength = Math.max(...arrays.map(arr => arr.length));
  const result = [];
  
  for (let i = 0; i < maxLength; i++) {
    result.push(arrays.map(arr => arr[i]));
  }
  
  return result;
}

/**
 * Separate array of tuples into parallel arrays
 * @param {array} data - Array of tuples
 * @returns {array} Array of arrays
 */
function unzip(data) {
  if (!data.length) return [];
  
  const length = data[0].length;
  const result = Array.from({ length }, () => []);
  
  for (const tuple of data) {
    for (let i = 0; i < length; i++) {
      result[i].push(tuple[i]);
    }
  }
  
  return result;
}

/**
 * Get intersection of arrays
 * @param {...array} arrays - Arrays to intersect
 * @returns {array} Common elements
 */
function intersection(...arrays) {
  if (arrays.length === 0) return [];
  if (arrays.length === 1) return [...arrays[0]];
  
  const first = new Set(arrays[0]);
  return [...first].filter(item => 
    arrays.every(arr => arr.includes(item))
  );
}

/**
 * Get difference (elements in first but not in others)
 * @param {array} first - First array
 * @param {...array} others - Arrays to subtract
 * @returns {array} Elements only in first array
 */
function difference(first, ...others) {
  const otherSets = others.map(arr => new Set(arr));
  return first.filter(item => 
    !otherSets.some(set => set.has(item))
  );
}

/**
 * Get union of arrays (deduplicated)
 * @param {...array} arrays - Arrays to combine
 * @returns {array} Union of all elements
 */
function union(...arrays) {
  return [...new Set(arrays.flat())];
}

/**
 * Remove null, undefined, and empty values from array
 * @param {array} data - Array to compact
 * @param {object} options - { removeEmpty, removeFalsy }
 * @returns {array} Compacted array
 */
function compact(data, options = {}) {
  const { removeEmpty = false, removeFalsy = false } = options;
  
  return data.filter(item => {
    if (item === null || item === undefined) return false;
    if (removeFalsy && !item) return false;
    if (removeEmpty && item === '') return false;
    return true;
  });
}

/**
 * Create object from array keyed by property
 * @param {array} data - Array of objects
 * @param {string} key - Property to use as key
 * @returns {object} Keyed object
 */
function keyBy(data, key) {
  return data.reduce((acc, item) => {
    acc[item[key]] = item;
    return acc;
  }, {});
}

/**
 * Pluck specific property from array of objects
 * @param {array} data - Array of objects
 * @param {string} key - Property to extract
 * @returns {array} Array of values
 */
function pluck(data, key) {
  return data.map(item => get(item, key));
}

/**
 * Partition array by predicate
 * @param {array} data - Array to partition
 * @param {function|string} predicate - Function or key name
 * @returns {array} [matching, notMatching]
 */
function partition(data, predicate) {
  const matching = [];
  const notMatching = [];
  
  const fn = typeof predicate === 'function' 
    ? predicate 
    : item => Boolean(item[predicate]);
  
  for (const item of data) {
    (fn(item) ? matching : notMatching).push(item);
  }
  
  return [matching, notMatching];
}

// ============================================================================
// COMPARISON FUNCTIONS
// ============================================================================

/**
 * Deep equality comparison
 * @param {any} a - First value
 * @param {any} b - Second value
 * @returns {boolean} True if deeply equal
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => deepEqual(a[key], b[key]));
  }
  
  return false;
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Truncate string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @param {object} options - { ellipsis, position }
 * @returns {string} Truncated string
 */
function truncate(str, length, options = {}) {
  const { ellipsis = '...', position = 'end' } = options;
  str = String(str);
  
  if (str.length <= length) return str;
  
  const truncLength = length - ellipsis.length;
  if (truncLength <= 0) return ellipsis.slice(0, length);
  
  switch (position) {
    case 'start':
      return ellipsis + str.slice(-truncLength);
    case 'middle':
      const half = Math.floor(truncLength / 2);
      return str.slice(0, half) + ellipsis + str.slice(-(truncLength - half));
    default:
      return str.slice(0, truncLength) + ellipsis;
  }
}

/**
 * Escape string for use in regular expression
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Pad string to length
 * @param {string} str - String to pad
 * @param {number} length - Target length
 * @param {object} options - { char, position }
 * @returns {string} Padded string
 */
function pad(str, length, options = {}) {
  const { char = ' ', position = 'end' } = options;
  str = String(str);
  
  if (str.length >= length) return str;
  
  const padding = char.repeat(Math.ceil((length - str.length) / char.length))
    .slice(0, length - str.length);
  
  switch (position) {
    case 'start':
      return padding + str;
    case 'both':
      const half = Math.floor(padding.length / 2);
      return padding.slice(0, half) + str + padding.slice(half);
    default:
      return str + padding;
  }
}

// ============================================================================
// INI FILE SUPPORT
// ============================================================================

/**
 * Parse INI string to object
 * @param {string} data - INI string
 * @returns {object} Parsed object
 */
function iniParse(data) {
  const result = {};
  let currentSection = result;
  
  for (let line of data.split('\n')) {
    line = line.trim();
    
    // Skip comments and empty lines
    if (!line || line.startsWith(';') || line.startsWith('#')) continue;
    
    // Section header
    if (line.startsWith('[') && line.endsWith(']')) {
      const section = line.slice(1, -1).trim();
      result[section] = {};
      currentSection = result[section];
      continue;
    }
    
    // Key-value pair
    const eqIndex = line.indexOf('=');
    if (eqIndex !== -1) {
      const key = line.slice(0, eqIndex).trim();
      let value = line.slice(eqIndex + 1).trim();
      
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Parse value types
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (!isNaN(value) && value !== '') value = Number(value);
      
      currentSection[key] = value;
    }
  }
  
  return result;
}

/**
 * Generate INI string from object
 * @param {object} data - Object to convert
 * @returns {string} INI string
 */
function iniGenerate(data) {
  const lines = [];
  
  // Process root-level values first
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'object' || value === null) {
      lines.push(`${key}=${_iniValue(value)}`);
    }
  }
  
  // Then process sections
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && value !== null) {
      if (lines.length > 0) lines.push('');
      lines.push(`[${key}]`);
      
      for (const [k, v] of Object.entries(value)) {
        lines.push(`${k}=${_iniValue(v)}`);
      }
    }
  }
  
  return lines.join('\n');
}

function _iniValue(value) {
  if (typeof value === 'string' && (value.includes(' ') || value.includes('='))) {
    return `"${value}"`;
  }
  return String(value);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // JSON
  jsonQuery,
  jsonTransform,
  
  // CSV
  csvParse,
  csvGenerate,
  
  // XML
  xmlParse,
  xmlGenerate,
  
  // YAML
  yamlParse,
  yamlGenerate,
  
  // INI
  iniParse,
  iniGenerate,
  
  // URL & Encoding
  urlEncode,
  urlDecode,
  queryStringParse,
  queryStringStringify,
  htmlEncode,
  htmlDecode,
  
  // String Case
  camelCase,
  pascalCase,
  snakeCase,
  kebabCase,
  constantCase,
  titleCase,
  slugify,
  
  // String Utilities
  truncate,
  escapeRegex,
  pad,
  
  // Validation
  validate,
  
  // Object manipulation
  flatten,
  unflatten,
  merge,
  pick,
  omit,
  get,
  set,
  groupBy,
  sortBy,
  unique,
  mapKeys,
  mapValues,
  template,
  diff,
  clone,
  deepEqual,
  
  // Array operations
  chunk,
  zip,
  unzip,
  intersection,
  difference,
  union,
  compact,
  keyBy,
  pluck,
  partition
};
