const { NlpManager } = require('node-nlp');
const logger = require('../../utils/logger');

class SentimentAnalyzer {
  constructor() {
    this.manager = new NlpManager({ languages: ['id'] });
    this.initializeSentimentAnalysis();
  }

  async initializeSentimentAnalysis() {
    // Add financial stress indicators
    this.addStressIndicators();
    // Add financial confidence indicators
    this.addConfidenceIndicators();
    await this.train();
  }

  addStressIndicators() {
    // High stress indicators
    this.manager.addDocument('id', 'saya khawatir tidak bisa bayar utang', 'sentiment.stress.high');
    this.manager.addDocument('id', 'uang saya tidak cukup untuk kebutuhan', 'sentiment.stress.high');
    this.manager.addDocument('id', 'bingung gimana bayar tagihan', 'sentiment.stress.high');
    this.manager.addDocument('id', 'takut bangkrut', 'sentiment.stress.high');

    // Medium stress indicators
    this.manager.addDocument('id', 'pengeluaran lebih besar dari pemasukan', 'sentiment.stress.medium');
    this.manager.addDocument('id', 'butuh tambahan penghasilan', 'sentiment.stress.medium');
    this.manager.addDocument('id', 'tabungan menipis', 'sentiment.stress.medium');

    // Low stress indicators
    this.manager.addDocument('id', 'ingin mengatur keuangan lebih baik', 'sentiment.stress.low');
    this.manager.addDocument('id', 'mau mulai nabung', 'sentiment.stress.low');
    this.manager.addDocument('id', 'bagaimana cara investasi yang baik', 'sentiment.stress.low');
  }

  addConfidenceIndicators() {
    // High confidence indicators
    this.manager.addDocument('id', 'berhasil menabung bulan ini', 'sentiment.confidence.high');
    this.manager.addDocument('id', 'investasi saya berkembang', 'sentiment.confidence.high');
    this.manager.addDocument('id', 'bisa mencapai target keuangan', 'sentiment.confidence.high');

    // Medium confidence indicators
    this.manager.addDocument('id', 'mulai bisa mengatur pengeluaran', 'sentiment.confidence.medium');
    this.manager.addDocument('id', 'ada sedikit tabungan', 'sentiment.confidence.medium');

    // Low confidence indicators
    this.manager.addDocument('id', 'ragu dengan keputusan keuangan', 'sentiment.confidence.low');
    this.manager.addDocument('id', 'tidak yakin dengan investasi', 'sentiment.confidence.low');
  }

  async train() {
    try {
      await this.manager.train();
      logger.info('Sentiment analyzer trained successfully');
    } catch (error) {
      logger.error('Error training sentiment analyzer:', error);
    }
  }

  async analyzeSentiment(text) {
    try {
      const result = await this.manager.process('id', text);
      
      // Get stress level
      const stressLevel = this.getStressLevel(result);
      
      // Get confidence level
      const confidenceLevel = this.getConfidenceLevel(result);

      // Generate appropriate response based on sentiment
      const response = this.generateResponse(stressLevel, confidenceLevel);

      return {
        stressLevel,
        confidenceLevel,
        response,
        raw: result
      };
    } catch (error) {
      logger.error('Error analyzing sentiment:', error);
      return null;
    }
  }

  getStressLevel(result) {
    const stressIntents = {
      'sentiment.stress.high': 3,
      'sentiment.stress.medium': 2,
      'sentiment.stress.low': 1
    };

    const matchedIntent = result.intents.find(intent => 
      Object.keys(stressIntents).includes(intent.intent)
    );

    return matchedIntent ? stressIntents[matchedIntent.intent] : 0;
  }

  getConfidenceLevel(result) {
    const confidenceIntents = {
      'sentiment.confidence.high': 3,
      'sentiment.confidence.medium': 2,
      'sentiment.confidence.low': 1
    };

    const matchedIntent = result.intents.find(intent => 
      Object.keys(confidenceIntents).includes(intent.intent)
    );

    return matchedIntent ? confidenceIntents[matchedIntent.intent] : 0;
  }

  generateResponse(stressLevel, confidenceLevel) {
    if (stressLevel === 3) {
      return {
        message: 'Saya mengerti Anda sedang menghadapi situasi keuangan yang sulit. Mari kita cari solusi bersama.',
        suggestions: [
          'Membuat rencana pengelolaan utang',
          'Tips menghemat pengeluaran',
          'Konsultasi dengan ahli keuangan'
        ]
      };
    } else if (stressLevel === 2) {
      return {
        message: 'Terlihat ada beberapa tantangan keuangan yang Anda hadapi. Saya bisa membantu Anda mengelolanya.',
        suggestions: [
          'Analisis pengeluaran bulanan',
          'Strategi penyesuaian anggaran',
          'Tips meningkatkan penghasilan'
        ]
      };
    } else if (confidenceLevel >= 2) {
      return {
        message: 'Bagus! Anda sudah di jalur yang tepat dalam mengelola keuangan.',
        suggestions: [
          'Tips investasi lanjutan',
          'Strategi diversifikasi',
          'Perencanaan keuangan jangka panjang'
        ]
      };
    } else {
      return {
        message: 'Mari mulai dengan langkah-langkah kecil dalam mengelola keuangan Anda.',
        suggestions: [
          'Membuat anggaran sederhana',
          'Tips menabung rutin',
          'Dasar-dasar investasi'
        ]
      };
    }
  }
}

module.exports = new SentimentAnalyzer();
