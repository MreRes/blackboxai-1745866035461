# WhatsApp Financial Management Bot

A comprehensive financial management system with WhatsApp integration that helps users track expenses, manage budgets, and achieve financial goals.

## Features

### WhatsApp Integration
- Natural Language Processing for understanding user messages
- Automated expense tracking through WhatsApp
- Real-time financial updates and notifications
- Smart financial assistant capabilities

### Financial Management
- Transaction tracking and categorization
- Budget planning and monitoring
- Financial goal setting and tracking
- Comprehensive financial reports and analytics
- Automated savings recommendations

### User Interface
- Modern, responsive web interface
- Real-time dashboard with financial overview
- Detailed transaction history
- Budget visualization and analytics
- Goal progress tracking
- Custom reports generation

## Technology Stack

### Backend
- Node.js + Express.js
- MongoDB (Database)
- WhatsApp Web.js (WhatsApp integration)
- NLP.js (Natural Language Processing)
- JWT (Authentication)
- Socket.io (Real-time updates)

### Frontend
- React.js
- Redux (State management)
- Tailwind CSS (Styling)
- Chart.js (Data visualization)
- Axios (API calls)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- WhatsApp account for bot integration
- npm or yarn package manager

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

4. Create environment variables:

Backend (.env):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/financial_bot
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

Frontend (.env):
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend application:
```bash
cd frontend
npm start
```

3. Access the application at http://localhost:8000

## WhatsApp Bot Setup

1. Log in to the web interface
2. Navigate to the WhatsApp Activation page
3. Scan the displayed QR code with your WhatsApp
4. Start using the bot with your activated number

## Bot Commands

The bot understands natural language, but here are some example commands:

- Record expense: "catat pengeluaran 50ribu untuk makan"
- Record income: "catat pemasukan 5juta dari gaji"
- Check balance: "cek saldo"
- View budget: "lihat budget"
- Set budget: "atur budget makan 2juta"
- View goals: "lihat target tabungan"
- Create goal: "buat target menabung 10juta untuk liburan"

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── whatsapp/
│   ├── package.json
│   └── server.js
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── utils/
    └── package.json
```

## Security Features

- JWT-based authentication
- Password hashing
- Rate limiting
- Input validation
- Session management
- Data encryption
- Secure WhatsApp connection

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@example.com or create an issue in the repository.

## Acknowledgments

- WhatsApp Web.js for WhatsApp integration
- NLP.js for natural language processing
- The React and Node.js communities for excellent documentation
