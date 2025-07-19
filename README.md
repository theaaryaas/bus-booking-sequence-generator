# Bus Boarding Sequence Generator

A full-stack application that generates optimal bus boarding sequences based on seat proximity to the front entry. The application processes booking data and creates a boarding sequence that minimizes passenger movement and improves boarding efficiency.

## Features

- **File Upload**: Upload TSV/CSV files containing booking data
- **Manual Input**: Enter booking data manually through the web interface
- **Smart Sequencing**: Automatically generates boarding sequences based on seat proximity to front entry
- **Real-time Processing**: Instant sequence generation with detailed results
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend
- React 18
- Axios for API calls
- React Dropzone for file uploads
- Lucide React for icons
- XLSX for Excel file processing

### Backend
- Node.js
- Express.js
- Multer for file upload handling
- CORS enabled for cross-origin requests

## Project Structure

```
busBookingPreference/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   └── package.json
├── server/                 # Node.js backend
│   ├── index.js
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd busBookingPreference
```

2. Install all dependencies:
```bash
npm run install-all
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## API Endpoints

### POST /api/generate-sequence
Upload a file to generate boarding sequence
- **Body**: Form data with file field
- **Response**: JSON with sequence data

### POST /api/generate-sequence-manual
Submit booking data manually
- **Body**: JSON with bookings array
- **Response**: JSON with sequence data

### GET /api/health
Health check endpoint
- **Response**: Status confirmation

## Input Format

The application accepts booking data in the following format:

### File Upload (TSV/CSV)
```
BookingID	Seats
1	1A, 2B, 3C
2	1D, 4A
3	2A, 5B
```

### Manual Input
```json
{
  "bookings": [
    {
      "bookingId": "1",
      "seats": "1A, 2B, 3C"
    },
    {
      "bookingId": "2", 
      "seats": "1D, 4A"
    }
  ]
}
```

## Output Format

The application generates a boarding sequence in the following format:

```json
{
  "success": true,
  "sequence": [
    {
      "seq": 1,
      "bookingId": "1",
      "closestSeat": "1A"
    },
    {
      "seq": 2,
      "bookingId": "2",
      "closestSeat": "1D"
    }
  ],
  "totalBookings": 2
}
```

## Deployment

### Render (Backend)
The backend is configured for deployment on Render with automatic environment variable handling.

### Vercel (Frontend)
The frontend is optimized for Vercel deployment with build configuration.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
 