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

// Function to validate seat format
function isValidSeat(seatLabel) {
  // Seat should contain at least one letter and one number
  // Valid formats: A1, B2, 1A, 2B, A10, 10A, etc.
  const seatPattern = /^[A-Za-z]+\d+|\d+[A-Za-z]+$/;
  return seatPattern.test(seatLabel.trim());
}

// Function to extract seat number from seat label
function extractSeatNumber(seatLabel) {
  const match = seatLabel.match(/\d+/);
  return match ? parseInt(match[0]) : Infinity;
}

// Function to generate boarding sequence
function generateBoardingSequence(bookings) {
  const validBookings = [];
  const invalidBookings = [];

  // Process each booking to validate seats and find the closest seat to front
  bookings.forEach(booking => {
    const seats = booking.seats.split(',').map(seat => seat.trim());
    const validSeats = seats.filter(seat => isValidSeat(seat));
    const invalidSeats = seats.filter(seat => !isValidSeat(seat));

    if (validSeats.length === 0) {
      // All seats are invalid
      invalidBookings.push({
        bookingId: booking.bookingId,
        seats: booking.seats,
        reason: 'All seats are invalid',
        invalidSeats: invalidSeats
      });
    } else if (invalidSeats.length > 0) {
      // Some seats are invalid, but we have valid ones
      const closestSeat = validSeats.reduce((closest, seat) => {
        const currentNumber = extractSeatNumber(seat);
        const closestNumber = extractSeatNumber(closest);
        return currentNumber < closestNumber ? seat : closest;
      });
      
      validBookings.push({
        bookingId: booking.bookingId,
        closestSeat: closestSeat,
        seatNumber: extractSeatNumber(closestSeat),
        originalSeats: booking.seats,
        validSeats: validSeats,
        invalidSeats: invalidSeats
      });
    } else {
      // All seats are valid
      const closestSeat = validSeats.reduce((closest, seat) => {
        const currentNumber = extractSeatNumber(seat);
        const closestNumber = extractSeatNumber(closest);
        return currentNumber < closestNumber ? seat : closest;
      });
      
      validBookings.push({
        bookingId: booking.bookingId,
        closestSeat: closestSeat,
        seatNumber: extractSeatNumber(closestSeat),
        originalSeats: booking.seats,
        validSeats: validSeats,
        invalidSeats: []
      });
    }
  });

  // Sort by seat number (closest to front first), then by booking ID
  const sortedBookings = validBookings.sort((a, b) => {
    if (a.seatNumber !== b.seatNumber) {
      return a.seatNumber - b.seatNumber;
    }
    return a.bookingId - b.bookingId;
  });

  // Generate sequence
  const sequence = sortedBookings.map((booking, index) => ({
    seq: index + 1,
    bookingId: booking.bookingId,
    closestSeat: booking.closestSeat,
    originalSeats: booking.originalSeats,
    validSeats: booking.validSeats,
    invalidSeats: booking.invalidSeats
  }));

  return {
    sequence: sequence,
    invalidBookings: invalidBookings,
    totalValidBookings: validBookings.length,
    totalInvalidBookings: invalidBookings.length
  };
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

    const result = generateBoardingSequence(bookings);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json(result);
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

    const result = generateBoardingSequence(bookings);
    
    res.json(result);
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