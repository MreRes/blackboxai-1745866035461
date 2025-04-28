const logger = require('../../utils/logger');
const sentimentAnalyzer = require('./sentimentAnalyzer');
const contextManager = require('./contextManager');
const dialectHandler = require('./dialectHandler');
const financialDictionary = require('./financialDictionary');

class EnhancedNLPHandler {
  constructor() {
    this.initializeHandler();
  }

  async initializeHandler() {
    try {
      logger.info('Initializing Enhanced NLP Handler');
      // Any additional initialization can be added here
    } catch (error) {
      logger.error('Error initializing Enhanced NLP Handler:', error);
    }
  }

  async processMessage(userId, message, metadata = {}) {
    try {
      logger.info(`Processing message for user ${userId}: ${message}`);

      // Step 1: Handle dialects and slang
      const dialectResult = dialectHandler.processMessage(message);
      const standardizedMessage = dialectResult.processedMessage;

      // Step 2: Analyze sentiment
      const sentimentResult = await sentimentAnalyzer.analyzeSentiment(standardizedMessage);

      // Step 3: Process with context
      const contextResult = await contextManager.processMessageWithContext(userId, standardizedMessage);

      // Step 4: Enhance with financial terms
      const enhancedResult = this.enhanceWithFinancialTerms(standardizedMessage);

      // Step 5: Generate appropriate response
      const response = await this.generateResponse({
        userId,
        originalMessage: message,
        standardizedMessage,
        dialectResult,
        sentimentResult,
        contextResult,
        enhancedResult,
        metadata
      });

      return response;
    } catch (error) {
      logger.error('Error processing message:', error);
      return {
        error: true,
        message: 'Maaf, terjadi kesalahan dalam memproses pesan Anda.'
      };
    }
  }

  enhanceWithFinancialTerms(message) {
    const terms = message.split(' ').map(word => {
      const termInfo = financialDictionary.getTerm(word);
      if (termInfo) {
        return {
          original: word,
          info: termInfo,
          synonyms: financialDictionary.getSynonyms(word),
          category: financialDictionary.getCategory(word)
        };
      }
      return null;
    }).filter(term => term !== null);

    return {
      terms,
      suggestions: this.getTermSuggestions(message)
    };
  }

  getTermSuggestions(message) {
    const words = message.split(' ');
    const suggestions = {};

    words.forEach(word => {
      if (!financialDictionary.getTerm(word)) {
        suggestions[word] = financialDictionary.getSuggestions(word, 3);
      }
    });

    return suggestions;
  }

  async generateResponse(data) {
    const {
      userId,
      originalMessage,
      standardizedMessage,
      dialectResult,
      sentimentResult,
      contextResult,
      enhancedResult,
      metadata
    } = data;

    // Base response structure
    const response = {
      userId,
      timestamp: new Date(),
      processed: {
        original: originalMessage,
        standardized: standardizedMessage,
        dialect: dialectResult.containsDialect,
        detectedRegionalPatterns: dialectResult.detectedRegionalPatterns
      },
      analysis: {
        sentiment: sentimentResult,
        context: contextResult,
        financialTerms: enhancedResult
      },
      response: null,
      suggestions: []
    };

    // Generate appropriate response based on analysis
    if (sentimentResult.stressLevel > 2) {
      // High stress response
      response.response = this.generateStressResponse(sentimentResult);
    } else if (contextResult.currentState === 'awaiting_confirmation') {
      // Context-based response
      response.response = contextResult.response;
    } else {
      // Standard response based on enhanced understanding
      response.response = this.generateStandardResponse(data);
    }

    // Add suggestions based on context and financial terms
    response.suggestions = this.generateSuggestions(data);

    return response;
  }

  generateStressResponse(sentimentResult) {
    return {
      type: 'stress_support',
      message: sentimentResult.response.message,
      actions: sentimentResult.response.suggestions.map(suggestion => ({
        type: 'suggestion',
        text: suggestion,
        action: `SUGGEST_${suggestion.toUpperCase().replace(/\s+/g, '_')}`
      }))
    };
  }

  generateStandardResponse(data) {
    const { contextResult, enhancedResult } = data;

    // If we have financial terms, use them to enhance the response
    if (enhancedResult.terms.length > 0) {
      return {
        type: 'financial_guidance',
        message: this.constructFinancialResponse(enhancedResult.terms),
        terms: enhancedResult.terms.map(term => ({
          term: term.original,
          definition: term.info.definition
        }))
      };
    }

    // Default to context-based response
    return {
      type: 'standard',
      message: contextResult.response
    };
  }

  constructFinancialResponse(terms) {
    // Construct a response that incorporates financial term definitions
    const mainTerm = terms[0];
    let response = `Mengenai ${mainTerm.original}, `;

    if (mainTerm.info.definition) {
      response += `${mainTerm.info.definition}. `;
    }

    if (mainTerm.synonyms && mainTerm.synonyms.length > 0) {
      response += `Istilah ini juga dikenal sebagai ${mainTerm.synonyms.join(', ')}. `;
    }

    if (mainTerm.info.examples && mainTerm.info.examples.length > 0) {
      response += `Contohnya: ${mainTerm.info.examples[0]}`;
    }

    return response;
  }

  generateSuggestions(data) {
    const suggestions = [];
    const { contextResult, enhancedResult } = data;

    // Add context-based suggestions
    if (contextResult.suggestions) {
      suggestions.push(...contextResult.suggestions);
    }

    // Add financial term suggestions
    if (enhancedResult.suggestions) {
      Object.entries(enhancedResult.suggestions).forEach(([word, termSuggestions]) => {
        if (termSuggestions.length > 0) {
          suggestions.push({
            type: 'term_suggestion',
            original: word,
            suggestions: termSuggestions
          });
        }
      });
    }

    return suggestions;
  }

  // Helper method to format currency amounts
  formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  }
}

module.exports = new EnhancedNLPHandler();
