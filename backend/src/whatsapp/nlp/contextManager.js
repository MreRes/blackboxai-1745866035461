const logger = require('../../utils/logger');

class ContextManager {
  constructor() {
    this.contexts = new Map();
    this.typoCorrections = this.initializeTypoCorrections();
    this.conversationTimeout = 5 * 60 * 1000; // 5 minutes
  }

  initializeTypoCorrections() {
    // Common Indonesian financial terms and their typos
    return new Map([
      // Pengeluaran related
      ['pngeluaran', 'pengeluaran'],
      ['pengluaran', 'pengeluaran'],
      ['keluar', 'pengeluaran'],
      
      // Pemasukan related
      ['pmasukan', 'pemasukan'],
      ['pemaskan', 'pemasukan'],
      ['masuk', 'pemasukan'],
      
      // Tabungan related
      ['tabungn', 'tabungan'],
      ['tabunagn', 'tabungan'],
      ['nabung', 'tabungan'],
      
      // Anggaran related
      ['angaran', 'anggaran'],
      ['anggran', 'anggaran'],
      ['bugdet', 'anggaran'],
      
      // Amount related
      ['rb', 'ribu'],
      ['jt', 'juta'],
      ['m', 'juta'],
      
      // Category related
      ['mkn', 'makan'],
      ['makn', 'makan'],
      ['transport', 'transportasi'],
      ['trans', 'transportasi'],
      
      // Command related
      ['ctat', 'catat'],
      ['liat', 'lihat'],
      ['lht', 'lihat']
    ]);
  }

  // Initialize or update user context
  setContext(userId, context) {
    this.contexts.set(userId, {
      ...context,
      lastUpdate: Date.now()
    });

    // Set timeout to clear context
    setTimeout(() => {
      this.clearContext(userId);
    }, this.conversationTimeout);
  }

  // Get user context
  getContext(userId) {
    const context = this.contexts.get(userId);
    if (!context) return null;

    // Check if context has expired
    if (Date.now() - context.lastUpdate > this.conversationTimeout) {
      this.clearContext(userId);
      return null;
    }

    return context;
  }

  // Clear user context
  clearContext(userId) {
    this.contexts.delete(userId);
  }

  // Correct typos in message
  correctTypos(message) {
    let words = message.toLowerCase().split(' ');
    let corrected = words.map(word => this.typoCorrections.get(word) || word);
    return corrected.join(' ');
  }

  // Process message with context
  async processMessageWithContext(userId, message) {
    try {
      // Correct typos
      const correctedMessage = this.correctTypos(message);
      
      // Get current context
      let context = this.getContext(userId);
      
      // Initialize new context if none exists
      if (!context) {
        context = {
          currentState: 'initial',
          data: {},
          lastUpdate: Date.now()
        };
      }

      // Process message based on current state
      const result = await this.processState(context, correctedMessage);

      // Update context
      this.setContext(userId, {
        ...context,
        ...result.newContext
      });

      return {
        response: result.response,
        correctedMessage: correctedMessage !== message ? correctedMessage : null
      };
    } catch (error) {
      logger.error('Error processing message with context:', error);
      return {
        response: 'Maaf, terjadi kesalahan dalam memproses pesan Anda.',
        error: error.message
      };
    }
  }

  // Process message based on current state
  async processState(context, message) {
    switch (context.currentState) {
      case 'initial':
        return this.processInitialState(message);
      
      case 'awaiting_amount':
        return this.processAmountState(context, message);
      
      case 'awaiting_category':
        return this.processCategoryState(context, message);
      
      case 'awaiting_confirmation':
        return this.processConfirmationState(context, message);
      
      default:
        return this.processInitialState(message);
    }
  }

  // Process initial state
  processInitialState(message) {
    // Check for transaction intent
    if (message.includes('catat') || message.includes('tambah')) {
      if (message.includes('pengeluaran')) {
        return {
          newContext: {
            currentState: 'awaiting_amount',
            data: { type: 'expense' }
          },
          response: 'Berapa jumlah pengeluarannya?'
        };
      }
      if (message.includes('pemasukan')) {
        return {
          newContext: {
            currentState: 'awaiting_amount',
            data: { type: 'income' }
          },
          response: 'Berapa jumlah pemasukannya?'
        };
      }
    }

    // Check for query intent
    if (message.includes('lihat') || message.includes('cek')) {
      if (message.includes('saldo')) {
        return {
          newContext: {
            currentState: 'initial',
            data: {}
          },
          response: 'Menampilkan informasi saldo Anda...'
        };
      }
      if (message.includes('transaksi')) {
        return {
          newContext: {
            currentState: 'initial',
            data: {}
          },
          response: 'Menampilkan riwayat transaksi Anda...'
        };
      }
    }

    return {
      newContext: {
        currentState: 'initial',
        data: {}
      },
      response: 'Maaf, saya tidak mengerti. Silakan coba perintah lain.'
    };
  }

  // Process amount state
  processAmountState(context, message) {
    // Extract amount from message
    const amount = this.extractAmount(message);
    if (!amount) {
      return {
        newContext: context,
        response: 'Maaf, saya tidak mengerti jumlahnya. Mohon masukkan jumlah yang valid (contoh: 50000 atau 50rb).'
      };
    }

    return {
      newContext: {
        currentState: 'awaiting_category',
        data: { ...context.data, amount }
      },
      response: 'Untuk kategori apa?'
    };
  }

  // Process category state
  processCategoryState(context, message) {
    return {
      newContext: {
        currentState: 'awaiting_confirmation',
        data: { ...context.data, category: message }
      },
      response: `Konfirmasi: ${context.data.type === 'expense' ? 'pengeluaran' : 'pemasukan'} sebesar ${context.data.amount} untuk ${message}. Benar? (ya/tidak)`
    };
  }

  // Process confirmation state
  processConfirmationState(context, message) {
    if (message.toLowerCase().includes('ya')) {
      return {
        newContext: {
          currentState: 'initial',
          data: {}
        },
        response: 'Transaksi berhasil dicatat!'
      };
    }

    if (message.toLowerCase().includes('tidak')) {
      return {
        newContext: {
          currentState: 'initial',
          data: {}
        },
        response: 'Baik, transaksi dibatalkan. Ada yang bisa saya bantu lagi?'
      };
    }

    return {
      newContext: context,
      response: 'Mohon jawab dengan "ya" atau "tidak".'
    };
  }

  // Helper method to extract amount from message
  extractAmount(message) {
    // Remove all non-numeric characters except 'k', 'm', 'rb', 'jt'
    const normalized = message.toLowerCase()
      .replace(/[^0-9kmrtb]/g, '')
      .replace('rb', 'k')
      .replace('jt', 'm');

    let multiplier = 1;
    if (normalized.endsWith('k')) {
      multiplier = 1000;
    } else if (normalized.endsWith('m')) {
      multiplier = 1000000;
    }

    const number = parseInt(normalized.replace(/[km]/g, ''));
    return number ? number * multiplier : null;
  }
}

module.exports = new ContextManager();
