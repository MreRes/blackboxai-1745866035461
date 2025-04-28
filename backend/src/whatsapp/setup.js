const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { processMessage } = require('./messageProcessor');
const { handleNLPResponse } = require('./nlpHandler');
const logger = require('../utils/logger');

let client = null;

const setupWhatsApp = async () => {
  try {
    // Initialize WhatsApp client with local authentication
    client = new Client({
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

    // Handle QR Code generation
    client.on('qr', async (qr) => {
      try {
        const qrCodeUrl = await qrcode.toDataURL(qr);
        // Store QR code or emit via socket for frontend display
        logger.info('New QR code generated');
      } catch (error) {
        logger.error('QR Code generation error:', error);
      }
    });

    // Handle client ready state
    client.on('ready', () => {
      logger.info('WhatsApp client is ready');
    });

    // Handle authentication
    client.on('authenticated', () => {
      logger.info('WhatsApp client authenticated');
    });

    // Handle authentication failure
    client.on('auth_failure', (error) => {
      logger.error('WhatsApp authentication failed:', error);
    });

    // Handle disconnection
    client.on('disconnected', (reason) => {
      logger.warn('WhatsApp client disconnected:', reason);
      // Attempt to reconnect
      client.destroy();
      client.initialize();
    });

    // Handle incoming messages
    client.on('message', async (message) => {
      try {
        // Check if message is from a registered and active user
        const isValidUser = await validateUser(message.from);
        if (!isValidUser) {
          await message.reply('Maaf, nomor Anda belum terdaftar atau tidak aktif. Silakan hubungi admin untuk aktivasi.');
          return;
        }

        // Process the message
        const processedMessage = await processMessage(message);
        
        // Handle the processed message with NLP
        const response = await handleNLPResponse(processedMessage);
        
        // Send response back to user
        await message.reply(response);
        
        // Log the interaction
        logger.info('Message processed successfully', {
          from: message.from,
          body: message.body,
          response
        });
      } catch (error) {
        logger.error('Error processing message:', error);
        await message.reply('Maaf, terjadi kesalahan dalam memproses pesan Anda. Silakan coba lagi.');
      }
    });

    // Initialize the client
    await client.initialize();

  } catch (error) {
    logger.error('WhatsApp setup error:', error);
    throw error;
  }
};

// Validate if the user is registered and active
const validateUser = async (phoneNumber) => {
  try {
    const User = require('../models/user.model');
    const formattedNumber = phoneNumber.replace(/[^\d]/g, '');
    
    const user = await User.findOne({
      'whatsappNumbers.number': formattedNumber,
      'whatsappNumbers.isActive': true,
      isActive: true,
      expiryDate: { $gt: new Date() }
    });

    return !!user;
  } catch (error) {
    logger.error('User validation error:', error);
    return false;
  }
};

// Get WhatsApp client instance
const getClient = () => {
  if (!client) {
    throw new Error('WhatsApp client not initialized');
  }
  return client;
};

// Send message to a specific number
const sendMessage = async (to, message) => {
  try {
    const client = getClient();
    await client.sendMessage(to, message);
    return true;
  } catch (error) {
    logger.error('Error sending message:', error);
    return false;
  }
};

module.exports = {
  setupWhatsApp,
  getClient,
  sendMessage
};
