const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const enhancedMessageProcessor = require('./enhancedMessageProcessor');
const { Readable } = require('stream');
const speech = require('@google-cloud/speech');
const ffmpeg = require('fluent-ffmpeg');
const tmp = require('tmp-promise');

class EnhancedWhatsAppSetup {
  constructor() {
    this.client = null;
    this.speechClient = new speech.SpeechClient();
    this.initializeClient();
  }

  initializeClient() {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: './whatsapp-session'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      });

      this.setupEventHandlers();
      logger.info('WhatsApp client initialized');
    } catch (error) {
      logger.error('Error initializing WhatsApp client:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    // QR Code event
    this.client.on('qr', async (qr) => {
      try {
        const qrCodeUrl = await qrcode.toDataURL(qr);
        logger.info('New QR code generated');
        // Store QR code or emit via socket for frontend display
      } catch (error) {
        logger.error('QR Code generation error:', error);
      }
    });

    // Ready event
    this.client.on('ready', () => {
      logger.info('WhatsApp client is ready');
    });

    // Authentication event
    this.client.on('authenticated', () => {
      logger.info('WhatsApp client authenticated');
    });

    // Authentication failure event
    this.client.on('auth_failure', (error) => {
      logger.error('WhatsApp authentication failed:', error);
    });

    // Disconnection event
    this.client.on('disconnected', (reason) => {
      logger.warn('WhatsApp client disconnected:', reason);
      this.handleDisconnection();
    });

    // Message event
    this.client.on('message', async (message) => {
      try {
        await this.handleMessage(message);
      } catch (error) {
        logger.error('Error handling message:', error);
      }
    });

    // Voice message event
    this.client.on('message_create', async (message) => {
      if (message.type === 'ptt' || message.type === 'audio') {
        await this.handleVoiceMessage(message);
      }
    });
  }

  async handleMessage(message) {
    try {
      const userId = message.from;

      // Handle different message types
      switch (message.type) {
        case 'chat':
          await this.handleTextMessage(message);
          break;
        case 'image':
          await this.handleImageMessage(message);
          break;
        case 'ptt':
        case 'audio':
          await this.handleVoiceMessage(message);
          break;
        default:
          await message.reply('Maaf, jenis pesan ini belum didukung.');
      }
    } catch (error) {
      logger.error('Error in handleMessage:', error);
      await message.reply('Maaf, terjadi kesalahan dalam memproses pesan Anda.');
    }
  }

  async handleTextMessage(message) {
    try {
      const response = await enhancedMessageProcessor.processMessage(message, message.from);
      
      if (response.error) {
        await message.reply(response.text);
        return;
      }

      // Send main response
      await message.reply(response.text);

      // Send suggestions if any
      if (response.suggestions && response.suggestions.length > 0) {
        const suggestionsText = '*Saran:*\n' + response.suggestions.join('\n');
        await message.reply(suggestionsText);
      }
    } catch (error) {
      logger.error('Error processing text message:', error);
      await message.reply('Maaf, terjadi kesalahan dalam memproses pesan Anda.');
    }
  }

  async handleVoiceMessage(message) {
    try {
      // Download voice message
      const media = await message.downloadMedia();
      
      // Create temporary file
      const { path: tempPath, cleanup } = await tmp.file();
      
      // Save audio buffer to temporary file
      await fs.writeFile(tempPath, Buffer.from(media.data, 'base64'));

      // Convert audio to proper format using ffmpeg
      const convertedPath = tempPath + '.wav';
      await this.convertAudio(tempPath, convertedPath);

      // Read the converted audio file
      const audioBytes = await fs.readFile(convertedPath);

      // Configure speech recognition request
      const audio = {
        content: audioBytes.toString('base64')
      };
      const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'id-ID',
      };
      const request = {
        audio: audio,
        config: config,
      };

      // Perform speech recognition
      const [response] = await this.speechClient.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

      // Clean up temporary files
      await cleanup();
      await fs.unlink(convertedPath).catch(() => {});

      // Process the transcribed text
      if (transcription) {
        logger.info(`Voice message transcribed: ${transcription}`);
        const processedResponse = await enhancedMessageProcessor.processMessage(
          { body: transcription, from: message.from },
          message.from
        );
        
        // Send response
        await message.reply(`🎤 *Pesan Suara:*\n${transcription}\n\n${processedResponse.text}`);
      } else {
        await message.reply('Maaf, saya tidak dapat memahami pesan suara Anda. Mohon coba lagi.');
      }
    } catch (error) {
      logger.error('Error processing voice message:', error);
      await message.reply('Maaf, terjadi kesalahan dalam memproses pesan suara Anda.');
    }
  }

  async handleImageMessage(message) {
    try {
      // Download image
      const media = await message.downloadMedia();
      
      // TODO: Implement receipt OCR processing
      await message.reply('Fitur pemindaian struk belanja sedang dalam pengembangan.');
    } catch (error) {
      logger.error('Error processing image message:', error);
      await message.reply('Maaf, terjadi kesalahan dalam memproses gambar Anda.');
    }
  }

  async convertAudio(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('wav')
        .outputOptions('-acodec pcm_s16le')
        .outputOptions('-ac 1')
        .outputOptions('-ar 16000')
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
  }

  handleDisconnection() {
    // Attempt to reconnect
    setTimeout(() => {
      logger.info('Attempting to reconnect WhatsApp client...');
      this.client.initialize();
    }, 5000);
  }

  async initialize() {
    try {
      await this.client.initialize();
      logger.info('WhatsApp client initialization started');
    } catch (error) {
      logger.error('Error during WhatsApp client initialization:', error);
      throw error;
    }
  }

  getClient() {
    return this.client;
  }

  async getStatus() {
    try {
      const state = await this.client.getState();
      return {
        status: state,
        connected: state === 'CONNECTED'
      };
    } catch (error) {
      logger.error('Error getting WhatsApp client status:', error);
      return {
        status: 'ERROR',
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = new EnhancedWhatsAppSetup();
