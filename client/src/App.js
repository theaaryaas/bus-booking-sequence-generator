import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Upload, Bus, Users, FileText, Plus, X, Download } from 'lucide-react';

// Configure API base URL for different environments
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

function App() {
  const [bookings, setBookings] = useState([]);
  const [sequence, setSequence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newBooking, setNewBooking] = useState({ bookingId: '', seats: '' });

  // File upload handling
  const onDrop = useCallback((acceptedFiles) => {
    console.log('Files dropped:', acceptedFiles);
    const file = acceptedFiles[0];
    if (file) {
      console.log('Processing file:', file.name, file.type, file.size);
      
      // Check if it's an Excel file
      const isExcelFile = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      
      if (isExcelFile) {
        // Handle Excel files
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            console.log('Excel data:', jsonData);
            
            const parsedBookings = [];
            
            // Skip header row and process data
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (row && row.length >= 2) {
                parsedBookings.push({
                  bookingId: String(row[0]).trim(),
                  seats: String(row[1]).trim()
                });
              }
            }
            
            console.log('Parsed bookings from Excel:', parsedBookings);
            
            if (parsedBookings.length === 0) {
              setError('No valid booking data found in Excel file. Please check the format.');
              return;
            }
            
            setBookings(parsedBookings);
            setError(null);
            setSuccess(`Successfully loaded ${parsedBookings.length} bookings from Excel file. Generating sequence...`);
            
            // Automatically generate sequence after file upload
            setLoading(true);
            try {
              const response = await api.post('/api/generate-sequence-manual', {
                bookings: parsedBookings
              });

              if (response.data.success) {
                setSequence(response.data.sequence);
                setSuccess(`Generated boarding sequence for ${response.data.totalBookings} bookings from uploaded Excel file`);
              }
            } catch (err) {
              console.error('API Error:', err);
              setError(err.response?.data?.error || 'Error generating sequence from uploaded Excel file');
            } finally {
              setLoading(false);
            }
            
          } catch (err) {
            console.error('Excel parsing error:', err);
            setError('Error parsing Excel file. Please ensure it has the correct format with Booking_id and Seats columns.');
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        // Handle text files (CSV, TSV, TXT)
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const content = e.target.result;
            console.log('File content:', content);
            const lines = content.trim().split('\n');
            console.log('Parsed lines:', lines);
            const parsedBookings = [];
            
            for (let i = 1; i < lines.length; i++) {
              // Handle both tab and comma separated values
              const values = lines[i].includes('\t') 
                ? lines[i].split('\t') 
                : lines[i].split(',');
              
              console.log(`Line ${i} values:`, values);
              
              if (values.length >= 2) {
                parsedBookings.push({
                  bookingId: values[0].trim(),
                  seats: values[1].trim()
                });
              }
            }
            
            console.log('Parsed bookings:', parsedBookings);
            
            if (parsedBookings.length === 0) {
              setError('No valid booking data found in file. Please check the format.');
              return;
            }
            
            setBookings(parsedBookings);
            setError(null);
            setSuccess(`Successfully loaded ${parsedBookings.length} bookings from file. Generating sequence...`);
            
            // Automatically generate sequence after file upload
            setLoading(true);
            try {
              const response = await api.post('/api/generate-sequence-manual', {
                bookings: parsedBookings
              });

              if (response.data.success) {
                setSequence(response.data.sequence);
                setSuccess(`Generated boarding sequence for ${response.data.totalBookings} bookings from uploaded file`);
              }
            } catch (err) {
              console.error('API Error:', err);
              setError(err.response?.data?.error || 'Error generating sequence from uploaded file');
            } finally {
              setLoading(false);
            }
            
          } catch (err) {
            console.error('File parsing error:', err);
            setError('Error parsing file. Please ensure it\'s in the correct format (tab or comma separated).');
          }
        };
        reader.readAsText(file);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'text/tab-separated-values': ['.tsv'],
      'application/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    onDropRejected: (rejectedFiles) => {
      console.log('Rejected files:', rejectedFiles);
      setError('File upload rejected. Please ensure you\'re uploading a valid .txt, .csv, .tsv, .xlsx, or .xls file.');
    }
  });

  // Manual input handling
  const handleAddBooking = () => {
    if (newBooking.bookingId && newBooking.seats) {
      setBookings([...bookings, { ...newBooking }]);
      setNewBooking({ bookingId: '', seats: '' });
      setError(null);
    } else {
      setError('Please fill in both Booking ID and Seats');
    }
  };

  const handleRemoveBooking = (index) => {
    setBookings(bookings.filter((_, i) => i !== index));
  };

  const handleInputChange = (field, value) => {
    setNewBooking({ ...newBooking, [field]: value });
  };

  // Generate sequence
  const generateSequence = async () => {
    if (bookings.length === 0) {
      setError('Please add some bookings first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/api/generate-sequence-manual', {
        bookings: bookings
      });

      if (response.data.success) {
        setSequence(response.data.sequence);
        setSuccess(`Generated boarding sequence for ${response.data.totalBookings} bookings`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error generating sequence');
    } finally {
      setLoading(false);
    }
  };



  // Export results
  const exportResults = () => {
    if (!sequence) return;

    const csvContent = [
      'Seq\tBooking_ID\tClosest_Seat',
      ...sequence.map(item => `${item.seq}\t${item.bookingId}\t${item.closestSeat}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'boarding_sequence.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <div className="header">
        <h1><Bus size={40} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
          Bus Boarding Sequence Generator</h1>
        <p>Generate optimal boarding sequences based on seat proximity to front entry point</p>
      </div>

      <div className="card">
        <div className="input-section">
          {/* File Upload Section */}
          <div>
            <h3><FileText size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Upload Booking File</h3>
            <div
              {...getRootProps()}
              className={`upload-area ${isDragActive ? 'dragover' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="upload-icon">
                <Upload size={48} />
              </div>
              <p>
                {isDragActive
                  ? 'Drop the file here...'
                  : 'Drag & drop a booking file here, or click to select'}
              </p>
              <small>Supports .txt, .csv, .tsv, .xlsx, .xls files</small>
              <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                Expected format: Booking_id,Seats (or Booking_id&#9;Seats)
              </small>
            </div>
          </div>

          {/* Manual Input Section */}
          <div>
            <h3><Users size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Manual Input</h3>
            <div className="manual-input">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Booking ID"
                  value={newBooking.bookingId}
                  onChange={(e) => handleInputChange('bookingId', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Seats (e.g., A1,B1)"
                  value={newBooking.seats}
                  onChange={(e) => handleInputChange('seats', e.target.value)}
                />
                <button className="add-btn" onClick={handleAddBooking}>
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Booking List */}
            {bookings.length > 0 && (
              <div className="booking-list">
                <h4>Current Bookings ({bookings.length})</h4>
                {bookings.map((booking, index) => (
                  <div key={index} className="booking-item">
                    <span><strong>{booking.bookingId}</strong> - {booking.seats}</span>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveBooking(index)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <button
          className="generate-btn"
          onClick={generateSequence}
          disabled={loading || bookings.length === 0}
        >
          {loading ? 'Generating Sequence...' : 'Generate Boarding Sequence'}
        </button>

        {/* Messages */}
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
      </div>

      {/* Results Section */}
      {sequence && (
        <div className="card results-section">
          <h3>Boarding Sequence Results</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>Sequence</th>
                <th>Booking ID</th>
                <th>Closest Seat</th>
              </tr>
            </thead>
            <tbody>
              {sequence.map((item) => (
                <tr key={item.seq}>
                  <td>
                    <div className="sequence-number">{item.seq}</div>
                  </td>
                  <td><strong>{item.bookingId}</strong></td>
                  <td>{item.closestSeat}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button
            className="generate-btn"
            onClick={exportResults}
            style={{ marginTop: '20px', maxWidth: '200px' }}
          >
            <Download size={16} style={{ marginRight: '8px' }} />
            Export Results
          </button>
        </div>
      )}

      {/* Bus Layout Visualization */}
      <div className="card bus-layout">
        <h3>Bus Layout Reference</h3>
        <div className="layout-grids-container">
          <div className="layout-grid">
            <div className="seat rear">A20/B20</div>
            <div className="seat rear">A19/B19</div>
            <div className="seat rear">A18/B18</div>
            <div className="seat rear">A17/B17</div>
            <div className="seat rear">A16/B16</div>
            <div className="seat rear">A15/B15</div>
            <div className="seat rear">A14/B14</div>
            <div className="seat rear">A13/B13</div>
            <div className="seat rear">A12/B12</div>
            <div className="seat rear">A11/B11</div>
            <div className="seat rear">A10/B10</div>
            <div className="seat rear">A9/B9</div>
            <div className="seat rear">A8/B8</div>
            <div className="seat rear">A7/B7</div>
            <div className="seat rear">A6/B6</div>
            <div className="seat rear">A5/B5</div>
            <div className="seat rear">A4/B4</div>
            <div className="seat rear">A3/B3</div>
            <div className="seat rear">A2/B2</div>
            <div className="seat front">A1/B1</div>
          </div>
          <div className="layout-grid">
            <div className="seat rear">C20/D20</div>
            <div className="seat rear">C19/D19</div>
            <div className="seat rear">C18/D18</div>
            <div className="seat rear">C17/D17</div>
            <div className="seat rear">C16/D16</div>
            <div className="seat rear">C15/D15</div>
            <div className="seat rear">C14/D14</div>
            <div className="seat rear">C13/D13</div>
            <div className="seat rear">C12/D12</div>
            <div className="seat rear">C11/D11</div>
            <div className="seat rear">C10/D10</div>
            <div className="seat rear">C9/D9</div>
            <div className="seat rear">C8/D8</div>
            <div className="seat rear">C7/D7</div>
            <div className="seat rear">C6/D6</div>
            <div className="seat rear">C5/D5</div>
            <div className="seat rear">C4/D4</div>
            <div className="seat rear">C3/D3</div>
            <div className="seat rear">C2/D2</div>
            <div className="seat front">C1/D1</div>
          </div>
        </div>
        <div className="entry-point">
          🚪 Front Entry Point
        </div>
        <div className="rules-section">
          <p><strong>Rules:</strong></p>
          <ul>
            <li>Only one entry in front</li>
            <li>Lower numbers = Closer to front entry</li>
            <li>Higher numbers = Further from front entry</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App; 