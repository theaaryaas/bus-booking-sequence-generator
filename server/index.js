const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads (temporary directory)
const upload = multer({ dest: require('os').tmpdir() });

// Function to extract seat number from seat label
function extractSeatNumber(seatLabel) {
  const match = seatLabel.match(/\d+/);
  return match ? parseInt(match[0]) : Infinity;
}

// Function to generate boarding sequence
function generateBoardingSequence(bookings) {
  // Process each booking to find the closest seat to front
  const processedBookings = bookings.map(booking => {
    const seats = booking.seats.split(',').map(seat => seat.trim());
    const closestSeat = seats.reduce((closest, seat) => {
      const currentNumber = extractSeatNumber(seat);
      const closestNumber = extractSeatNumber(closest);
      return currentNumber < closestNumber ? seat : closest;
    });
    
    return {
      bookingId: booking.bookingId,
      closestSeat: closestSeat,
      seatNumber: extractSeatNumber(closestSeat)
    };
  });

  // Sort by seat number (closest to front first), then by booking ID
  const sortedBookings = processedBookings.sort((a, b) => {
    if (a.seatNumber !== b.seatNumber) {
      return a.seatNumber - b.seatNumber;
    }
    return a.bookingId - b.bookingId;
  });

  // Generate sequence
  return sortedBookings.map((booking, index) => ({
    seq: index + 1,
    bookingId: booking.bookingId,
    closestSeat: booking.closestSeat
  }));
}

// Parse CSV/TSV data
function parseBookingData(fileContent) {
  const lines = fileContent.trim().split('\n');
  const headers = lines[0].split('\t');
  
  const bookings = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    if (values.length >= 2) {
      bookings.push({
        bookingId: values[0].trim(),
        seats: values[1].trim()
      });
    }
  }
  
  return bookings;
}

// API Routes
app.post('/api/generate-sequence', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const bookings = parseBookingData(fileContent);
    
    if (bookings.length === 0) {
      return res.status(400).json({ error: 'No valid booking data found' });
    }

    const sequence = generateBoardingSequence(bookings);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      sequence: sequence,
      totalBookings: bookings.length
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Error processing file' });
  }
});

// Manual input endpoint
app.post('/api/generate-sequence-manual', (req, res) => {
  try {
    const { bookings } = req.body;
    
    if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
      return res.status(400).json({ error: 'Invalid booking data' });
    }

    const sequence = generateBoardingSequence(bookings);
    
    res.json({
      success: true,
      sequence: sequence,
      totalBookings: bookings.length
    });
  } catch (error) {
    console.error('Error processing manual input:', error);
    res.status(500).json({ error: 'Error processing input' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Bus Boarding Sequence Generator API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 