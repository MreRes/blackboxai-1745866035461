# WhatsApp Financial Management Bot (Enhanced Version)

A comprehensive financial management system with advanced WhatsApp integration, featuring enhanced NLP capabilities, voice message support, and intelligent financial analysis.

## Enhanced Features

### Advanced NLP Capabilities
- Sentiment analysis for financial stress detection
- Context-aware conversation management
- Automatic typo correction for Indonesian language
- Regional dialect and slang support
- Financial terms dictionary and synonyms

### Smart Financial Features
- ML-based expense categorization
- Predictive spending pattern analysis
- Personalized savings recommendations
- Detailed goal tracking
- Automated recurring transactions
- Dynamic budget adjustments

### Advanced User Interaction
- Voice message support for transaction recording
- Receipt image scanning (coming soon)
- Interactive buttons and list messages
- Smart quick replies based on user history
- Customizable reminder schedules
- Group expense tracking

### Financial Education
- Daily financial tips
- Goal achievement gamification
- Market updates and financial news
- Investment education content
- Debt management advice

### Integration Capabilities
- Excel/Google Sheets/PDF export
- QR code payment support

### Enhanced Security
- Large transaction verification
- Suspicious activity detection
- End-to-end encryption
- IP-based access control

### Performance Optimizations
- Message queue system
- Request caching
- Response time optimization
- Batch report processing

### Advanced Analytics
- Enhanced data visualization
- Comparative user analysis
- Custom report builder
- Tax calculation and reporting
- Financial health scoring

## Prerequisites

- Node.js (>= 14.0.0)
- MongoDB
- Google Cloud account (for Speech-to-Text)
- WhatsApp account for bot
- FFmpeg (for voice message processing)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/whatsapp-financial-bot.git
cd whatsapp-financial-bot
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Set up environment variables:
```bash
cd backend
cp .env.example .env
```
Edit .env with your configuration values.

5. Set up Google Cloud credentials:
- Create a project in Google Cloud Console
- Enable Speech-to-Text API
- Download credentials JSON file
- Set GOOGLE_APPLICATION_CREDENTIALS in .env

## Running the Application

1. Start MongoDB:
```bash
mongod
```

2. Start the backend server:
```bash
cd backend
npm run dev
```

3. Start the frontend application:
```bash
cd frontend
npm start
```

4. Access the application at http://localhost:3000

## WhatsApp Integration Setup

1. Log in to the web interface
2. Navigate to WhatsApp Activation
3. Scan the QR code with your WhatsApp
4. Start using the enhanced bot features

## Enhanced Bot Commands

The bot now understands natural language better, but here are some example commands:

### Transaction Recording
```
catat pengeluaran 50rb untuk makan
catat pemasukan 5jt dari gaji
```

### Voice Messages
```
[Send voice message describing transaction]
```

### Budget Management
```
atur budget makan 2jt
cek sisa anggaran
```

### Goal Tracking
```
target menabung 10jt untuk liburan
cek progress tabungan
```

### Financial Reports
```
laporan keuangan bulan ini
analisis pengeluaran
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- Session management
- Data encryption
- Secure WhatsApp connection

## Development

### Project Structure
```
.
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── whatsapp/
│   │       ├── nlp/
│   │       │   ├── sentimentAnalyzer.js
│   │       │   ├── contextManager.js
│   │       │   ├── dialectHandler.js
│   │       │   └── financialDictionary.js
│   │       ├── enhancedMessageProcessor.js
│   │       └── enhancedSetup.js
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── utils/
    └── package.json
```

### Running Tests
```bash
cd backend
npm test
```

### Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Performance Considerations

- Use PM2 for process management in production
- Enable caching for frequently accessed data
- Monitor memory usage with WhatsApp client
- Implement request rate limiting
- Use connection pooling for MongoDB

## Troubleshooting

Common issues and solutions:

1. WhatsApp Connection Issues
   - Ensure stable internet connection
   - Check WhatsApp session status
   - Clear WhatsApp session and rescan QR

2. Voice Message Processing
   - Verify FFmpeg installation
   - Check Google Cloud credentials
   - Ensure proper audio format

3. Database Connection
   - Verify MongoDB service is running
   - Check connection string
   - Ensure proper authentication

## Support

For support:
- Create an issue in the repository
- Email: support@example.com
- Documentation: [Wiki](link-to-wiki)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- WhatsApp Web.js for WhatsApp integration
- Google Cloud for Speech-to-Text
- NLP.js for natural language processing
- The React and Node.js communities
