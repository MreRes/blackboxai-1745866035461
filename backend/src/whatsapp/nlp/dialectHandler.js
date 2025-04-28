const logger = require('../../utils/logger');

class DialectHandler {
  constructor() {
    this.dialectMappings = this.initializeDialectMappings();
    this.slangMappings = this.initializeSlangMappings();
    this.regionalPatterns = this.initializeRegionalPatterns();
  }

  initializeDialectMappings() {
    // Regional dialect mappings to standard Indonesian
    return {
      // Javanese influenced
      'piye': 'bagaimana',
      'piro': 'berapa',
      'duit': 'uang',
      'duwit': 'uang',
      'opo': 'apa',
      'nggo': 'untuk',
      
      // Sundanese influenced
      'kumaha': 'bagaimana',
      'sabaraha': 'berapa',
      'duit': 'uang',
      'naon': 'apa',
      'keur': 'untuk',
      
      // Betawi influenced
      'gimana': 'bagaimana',
      'berape': 'berapa',
      'duit': 'uang',
      'apaan': 'apa',
      'buat': 'untuk',
      
      // Medan influenced
      'macam mana': 'bagaimana',
      'brapa': 'berapa',
      'duit': 'uang',
      'apa': 'apa',
      'untuk': 'untuk'
    };
  }

  initializeSlangMappings() {
    // Modern Indonesian slang mappings
    return {
      // Money related
      'duid': 'uang',
      'gopek': '500',
      'cepe': '100',
      'sejuta': '1000000',
      'sejt': '1000000',
      'seceng': '1000',
      'serbu': '1000',
      
      // Transaction related
      'tf': 'transfer',
      'trf': 'transfer',
      'kirim': 'transfer',
      'krim': 'transfer',
      
      // Amount related
      'k': '000',
      'm': '000000',
      'jt': '000000',
      'rb': '000',
      
      // Category related
      'mam': 'makan',
      'mkn': 'makan',
      'gojek': 'transportasi',
      'grab': 'transportasi',
      'belanja': 'shopping',
      'shopping': 'shopping',
      'listrik': 'utilities',
      'pln': 'utilities',
      'pulsa': 'utilities',
      'inet': 'internet',
      
      // Action related
      'cek': 'lihat',
      'liat': 'lihat',
      'tampil': 'lihat',
      'simpen': 'simpan',
      'masukin': 'masukkan'
    };
  }

  initializeRegionalPatterns() {
    // Regional speech patterns and structures
    return [
      {
        region: 'jawa',
        patterns: [
          {
            match: /tak\s+(.*?)\s+sek/i,
            transform: (match) => `saya ${match[1]} dulu`
          },
          {
            match: /monggo\s+(.*?)/i,
            transform: (match) => `silakan ${match[1]}`
          }
        ]
      },
      {
        region: 'sunda',
        patterns: [
          {
            match: /mangga\s+(.*?)/i,
            transform: (match) => `silakan ${match[1]}`
          },
          {
            match: /abdi\s+(.*?)/i,
            transform: (match) => `saya ${match[1]}`
          }
        ]
      },
      {
        region: 'betawi',
        patterns: [
          {
            match: /gua\s+(.*?)/i,
            transform: (match) => `saya ${match[1]}`
          },
          {
            match: /ane\s+(.*?)/i,
            transform: (match) => `saya ${match[1]}`
          }
        ]
      }
    ];
  }

  processMessage(message) {
    try {
      // Convert to lowercase for consistent processing
      let processedMessage = message.toLowerCase();

      // Apply regional pattern transformations
      processedMessage = this.applyRegionalPatterns(processedMessage);

      // Split message into words
      let words = processedMessage.split(' ');

      // Process each word
      words = words.map(word => {
        // Check dialect mappings
        if (this.dialectMappings[word]) {
          return this.dialectMappings[word];
        }

        // Check slang mappings
        if (this.slangMappings[word]) {
          return this.slangMappings[word];
        }

        return word;
      });

      // Rejoin words
      processedMessage = words.join(' ');

      // Process amount formats
      processedMessage = this.processAmountFormats(processedMessage);

      return {
        originalMessage: message,
        processedMessage,
        containsDialect: message.toLowerCase() !== processedMessage,
        detectedRegionalPatterns: this.detectRegionalPatterns(message)
      };
    } catch (error) {
      logger.error('Error processing dialect:', error);
      return {
        originalMessage: message,
        processedMessage: message,
        error: error.message
      };
    }
  }

  applyRegionalPatterns(message) {
    let processedMessage = message;

    this.regionalPatterns.forEach(region => {
      region.patterns.forEach(pattern => {
        processedMessage = processedMessage.replace(
          pattern.match,
          (match, ...args) => pattern.transform([match, ...args])
        );
      });
    });

    return processedMessage;
  }

  detectRegionalPatterns(message) {
    const detectedPatterns = [];

    this.regionalPatterns.forEach(region => {
      region.patterns.forEach(pattern => {
        if (pattern.match.test(message)) {
          detectedPatterns.push({
            region: region.region,
            pattern: pattern.match.toString()
          });
        }
      });
    });

    return detectedPatterns;
  }

  processAmountFormats(message) {
    // Process number formats with currency denominations
    return message.replace(
      /(\d+)\s*(k|rb|jt|m)/gi,
      (match, number, unit) => {
        const num = parseInt(number);
        switch (unit.toLowerCase()) {
          case 'k':
          case 'rb':
            return (num * 1000).toString();
          case 'jt':
          case 'm':
            return (num * 1000000).toString();
          default:
            return match;
        }
      }
    );
  }

  // Add new dialect or slang mapping
  addMapping(type, word, standardForm) {
    if (type === 'dialect') {
      this.dialectMappings[word] = standardForm;
    } else if (type === 'slang') {
      this.slangMappings[word] = standardForm;
    }
  }

  // Add new regional pattern
  addRegionalPattern(region, pattern, transform) {
    const existingRegion = this.regionalPatterns.find(r => r.region === region);
    if (existingRegion) {
      existingRegion.patterns.push({ match: pattern, transform });
    } else {
      this.regionalPatterns.push({
        region,
        patterns: [{ match: pattern, transform }]
      });
    }
  }

  // Get suggestions for unknown words
  getSuggestions(word) {
    const allWords = [
      ...Object.keys(this.dialectMappings),
      ...Object.keys(this.slangMappings)
    ];

    return allWords
      .map(knownWord => ({
        word: knownWord,
        similarity: this.calculateSimilarity(word, knownWord)
      }))
      .filter(result => result.similarity > 0.6)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(result => result.word);
  }

  // Calculate word similarity using Levenshtein distance
  calculateSimilarity(word1, word2) {
    const length1 = word1.length;
    const length2 = word2.length;
    const matrix = Array(length1 + 1).fill().map(() => Array(length2 + 1).fill(0));

    for (let i = 0; i <= length1; i++) matrix[i][0] = i;
    for (let j = 0; j <= length2; j++) matrix[0][j] = j;

    for (let i = 1; i <= length1; i++) {
      for (let j = 1; j <= length2; j++) {
        const cost = word1[i - 1] === word2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const maxLength = Math.max(length1, length2);
    return 1 - matrix[length1][length2] / maxLength;
  }
}

module.exports = new DialectHandler();
