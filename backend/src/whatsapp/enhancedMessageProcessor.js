const enhancedNLPHandler = require('./nlp/enhancedNLPHandler');
const Transaction = require('../models/transaction.model');
const Budget = require('../models/budget.model');
const Goal = require('../models/goal.model');
const logger = require('../utils/logger');

class EnhancedMessageProcessor {
  constructor() {
    this.supportedCommands = this.initializeSupportedCommands();
  }

  initializeSupportedCommands() {
    return {
      // Transaction Commands
      'catat': {
        type: 'transaction',
        action: 'create',
        examples: [
          'catat pengeluaran 50rb untuk makan',
          'catat pemasukan 5jt dari gaji'
        ]
      },
      'hapus': {
        type: 'transaction',
        action: 'delete',
        examples: [
          'hapus transaksi terakhir',
          'hapus pengeluaran makan kemarin'
        ]
      },
      'ubah': {
        type: 'transaction',
        action: 'update',
        examples: [
          'ubah jumlah jadi 75rb',
          'ubah kategori jadi transportasi'
        ]
      },
      'lihat': {
        type: 'transaction',
        action: 'view',
        examples: [
          'lihat transaksi hari ini',
          'lihat pengeluaran bulan ini'
        ]
      },

      // Budget Commands
      'atur': {
        type: 'budget',
        action: 'set',
        examples: [
          'atur budget makan 2jt',
          'atur anggaran transportasi 500rb'
        ]
      },
      'cek': {
        type: 'budget',
        action: 'check',
        examples: [
          'cek budget',
          'cek sisa anggaran'
        ]
      },

      // Goal Commands
      'target': {
        type: 'goal',
        action: 'create',
        examples: [
          'target menabung 10jt untuk liburan',
          'target keuangan 50jt untuk dp rumah'
        ]
      },
      'progress': {
        type: 'goal',
        action: 'check',
        examples: [
          'progress tabungan',
          'progress target'
        ]
      },

      // Report Commands
      'laporan': {
        type: 'report',
        action: 'generate',
        examples: [
          'laporan keuangan bulan ini',
          'laporan pengeluaran minggu ini'
        ]
      },
      'analisis': {
        type: 'report',
        action: 'analyze',
        examples: [
          'analisis pengeluaran',
          'analisis budget'
        ]
      },

      // Help Commands
      'bantuan': {
        type: 'help',
        action: 'show',
        examples: [
          'bantuan',
          'cara pakai bot'
        ]
      }
    };
  }

  async processMessage(message, userId) {
    try {
      logger.info(`Processing message from user ${userId}: ${message.body}`);

      // Process message with enhanced NLP
      const nlpResult = await enhancedNLPHandler.processMessage(userId, message.body, {
        messageId: message.id,
        timestamp: message.timestamp
      });

      // Handle high stress situations
      if (nlpResult.analysis.sentiment.stressLevel > 2) {
        return this.handleStressfulSituation(nlpResult);
      }

      // Process based on context
      if (nlpResult.analysis.context.currentState !== 'initial') {
        return this.handleContextualResponse(nlpResult);
      }

      // Process command
      const command = this.identifyCommand(message.body);
      if (command) {
        return this.executeCommand(command, nlpResult);
      }

      // Generate response based on NLP analysis
      return this.generateResponse(nlpResult);
    } catch (error) {
      logger.error('Error processing message:', error);
      return {
        text: 'Maaf, terjadi kesalahan dalam memproses pesan Anda. Silakan coba lagi.',
        error: true
      };
    }
  }

  handleStressfulSituation(nlpResult) {
    const { response } = nlpResult.analysis.sentiment;
    return {
      text: response.message,
      suggestions: response.suggestions,
      type: 'support'
    };
  }

  async handleContextualResponse(nlpResult) {
    const { contextResult } = nlpResult.analysis;
    
    if (contextResult.action) {
      switch (contextResult.action) {
        case 'create_transaction':
          return this.createTransaction(contextResult.data);
        case 'update_budget':
          return this.updateBudget(contextResult.data);
        case 'set_goal':
          return this.setGoal(contextResult.data);
        default:
          return {
            text: contextResult.response,
            type: 'context'
          };
      }
    }

    return {
      text: contextResult.response,
      type: 'context'
    };
  }

  identifyCommand(message) {
    const normalizedMessage = message.toLowerCase();
    
    for (const [command, details] of Object.entries(this.supportedCommands)) {
      if (normalizedMessage.startsWith(command)) {
        return {
          command,
          ...details
        };
      }
    }

    return null;
  }

  async executeCommand(command, nlpResult) {
    try {
      switch (command.type) {
        case 'transaction':
          return this.handleTransactionCommand(command, nlpResult);
        case 'budget':
          return this.handleBudgetCommand(command, nlpResult);
        case 'goal':
          return this.handleGoalCommand(command, nlpResult);
        case 'report':
          return this.handleReportCommand(command, nlpResult);
        case 'help':
          return this.handleHelpCommand(command, nlpResult);
        default:
          return {
            text: 'Maaf, perintah tidak dikenali.',
            type: 'error'
          };
      }
    } catch (error) {
      logger.error('Error executing command:', error);
      return {
        text: 'Maaf, terjadi kesalahan dalam menjalankan perintah.',
        error: true
      };
    }
  }

  async handleTransactionCommand(command, nlpResult) {
    const { action } = command;
    const { enhancedResult } = nlpResult.analysis;

    switch (action) {
      case 'create':
        return this.createTransaction(enhancedResult.data);
      case 'delete':
        return this.deleteTransaction(enhancedResult.data);
      case 'update':
        return this.updateTransaction(enhancedResult.data);
      case 'view':
        return this.viewTransactions(enhancedResult.data);
      default:
        return {
          text: 'Maaf, aksi transaksi tidak valid.',
          type: 'error'
        };
    }
  }

  async handleBudgetCommand(command, nlpResult) {
    const { action } = command;
    const { enhancedResult } = nlpResult.analysis;

    switch (action) {
      case 'set':
        return this.setBudget(enhancedResult.data);
      case 'check':
        return this.checkBudget(enhancedResult.data);
      default:
        return {
          text: 'Maaf, aksi anggaran tidak valid.',
          type: 'error'
        };
    }
  }

  async handleGoalCommand(command, nlpResult) {
    const { action } = command;
    const { enhancedResult } = nlpResult.analysis;

    switch (action) {
      case 'create':
        return this.createGoal(enhancedResult.data);
      case 'check':
        return this.checkGoal(enhancedResult.data);
      default:
        return {
          text: 'Maaf, aksi target tidak valid.',
          type: 'error'
        };
    }
  }

  async handleReportCommand(command, nlpResult) {
    const { action } = command;
    const { enhancedResult } = nlpResult.analysis;

    switch (action) {
      case 'generate':
        return this.generateReport(enhancedResult.data);
      case 'analyze':
        return this.analyzeFinances(enhancedResult.data);
      default:
        return {
          text: 'Maaf, aksi laporan tidak valid.',
          type: 'error'
        };
    }
  }

  handleHelpCommand(command, nlpResult) {
    const { enhancedResult } = nlpResult.analysis;
    const topic = enhancedResult.terms[0]?.original;

    if (topic && this.supportedCommands[topic]) {
      const commandDetails = this.supportedCommands[topic];
      return {
        text: `Bantuan untuk perintah "${topic}":\n\nContoh penggunaan:\n${commandDetails.examples.join('\n')}`,
        type: 'help'
      };
    }

    return {
      text: 'Perintah yang tersedia:\n\n' +
            Object.entries(this.supportedCommands)
              .map(([cmd, details]) => `${cmd}: ${details.examples[0]}`)
              .join('\n\n'),
      type: 'help'
    };
  }

  generateResponse(nlpResult) {
    const { response, suggestions } = nlpResult;
    
    return {
      text: response.message,
      suggestions: suggestions,
      type: response.type
    };
  }

  // Helper method to format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  }
}

module.exports = new EnhancedMessageProcessor();
