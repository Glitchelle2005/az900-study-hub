/**
 * AuraCloud AZ-900 Study Suite - Backend Server
 * Architecture: REST API Server with persistent JSON Database & Static Asset Pipeline
 * Standard: Pure Node.js (Zero external npm dependencies required)
 * 
 * Endpoints:
 * - Static: /, /signin, /css/*, /js/*
 * - Auth: POST /api/auth/login, POST /api/auth/register, POST /api/auth/logout
 * - Search: GET /api/search?q=...
 * - Concepts: GET /api/concepts, GET /api/concepts/:id
 * - Quizzes: GET /api/questions, POST /api/attempts, GET /api/attempts
 * - Flashcards: GET /api/flashcards, PUT /api/flashcards/:id
 * - Analytics: GET /api/stats
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'database.json');

// Ensure database file exists
function loadDatabase() {
  try {
    delete require.cache[require.resolve('./data/database.json')];
    return require('./data/database.json');
  } catch (err) {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {}
    console.error('[DB] Error reading database:', err.message);
    return { users: [], concepts: [], questions: [], flashcards: [], attempts: [] };
  }
}

function saveDatabase(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[DB] Error writing to database:', err.message);
    return false;
  }
}

// MIME types dictionary for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper to parse JSON body from incoming requests
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB flood protection
        if (req.destroy) req.destroy();
        else if (req.socket && req.socket.destroy) req.socket.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Helper to send standardized JSON responses
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Server Request Handler
async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS preflight options
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // ==========================================
  // REST API ROUTES (/api/...)
  // ==========================================

  // Health Check
  if (pathname === '/api/health' && method === 'GET') {
    return sendJSON(res, 200, {
      status: 'operational',
      appName: 'AuraCloud AZ-900 Study Suite Server',
      timestamp: new Date().toISOString(),
      databaseLoaded: fs.existsSync(DB_FILE)
    });
  }

  // AUTH: Login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const { email, password } = await parseRequestBody(req);
    const db = loadDatabase();
    
    if (!email || !password) {
      return sendJSON(res, 400, { success: false, message: 'Email and password are required.' });
    }

    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      return sendJSON(res, 401, { success: false, message: 'Invalid credentials. Please verify your email and password.' });
    }

    // Return safe user object (omit password)
    const { password: _, ...safeUser } = user;
    const token = 'session_' + Math.random().toString(36).substring(2) + Date.now();
    return sendJSON(res, 200, {
      success: true,
      message: 'Sign in successful. Welcome back!',
      user: safeUser,
      token
    });
  }

  // AUTH: Register
  if (pathname === '/api/auth/register' && method === 'POST') {
    const { name, email, password, role } = await parseRequestBody(req);
    const db = loadDatabase();

    if (!name || !email || !password) {
      return sendJSON(res, 400, { success: false, message: 'Name, email, and password are required.' });
    }

    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return sendJSON(res, 409, { success: false, message: 'An account with this email address already exists.' });
    }

    const initials = name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AZ';
    const newUser = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role || 'AZ-900 Candidate',
      avatarInitials: initials,
      examDate: '2026-11-20',
      hoursPerDay: 2,
      streakDays: 1,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDatabase(db);

    const { password: _, ...safeUser } = newUser;
    const token = 'session_' + Math.random().toString(36).substring(2) + Date.now();
    return sendJSON(res, 201, {
      success: true,
      message: 'Account created successfully.',
      user: safeUser,
      token
    });
  }

  // AUTH: Logout
  if (pathname === '/api/auth/logout' && method === 'POST') {
    return sendJSON(res, 200, { success: true, message: 'Signed out successfully.' });
  }

  // SEARCH: Real-time search across Database (Concepts, Questions, Flashcards)
  if (pathname === '/api/search' && method === 'GET') {
    const query = (parsedUrl.query.q || '').toString().trim().toLowerCase();
    const db = loadDatabase();

    if (!query) {
      return sendJSON(res, 200, {
        query: '',
        totalResults: 0,
        concepts: (db.concepts || []).slice(0, 5),
        questions: (db.questions || []).slice(0, 3),
        flashcards: (db.flashcards || []).slice(0, 3)
      });
    }

    // Filter concepts
    const matchedConcepts = (db.concepts || []).filter(c => {
      return c.title.toLowerCase().includes(query) ||
             c.summary.toLowerCase().includes(query) ||
             c.domain.toLowerCase().includes(query) ||
             (c.keywords && c.keywords.some(k => k.toLowerCase().includes(query))) ||
             (c.deepDive && c.deepDive.some(d => d.toLowerCase().includes(query))) ||
             (c.examTip && c.examTip.toLowerCase().includes(query)) ||
             (c.analogy && c.analogy.toLowerCase().includes(query));
    });

    // Filter questions
    const matchedQuestions = (db.questions || []).filter(q => {
      return q.question.toLowerCase().includes(query) ||
             q.domain.toLowerCase().includes(query) ||
             q.explanation.toLowerCase().includes(query) ||
             q.options.some(opt => opt.toLowerCase().includes(query));
    });

    // Filter flashcards
    const matchedFlashcards = (db.flashcards || []).filter(f => {
      return f.front.toLowerCase().includes(query) ||
             f.back.toLowerCase().includes(query) ||
             f.domain.toLowerCase().includes(query) ||
             (f.analogy && f.analogy.toLowerCase().includes(query));
    });

    return sendJSON(res, 200, {
      query,
      totalResults: matchedConcepts.length + matchedQuestions.length + matchedFlashcards.length,
      concepts: matchedConcepts,
      questions: matchedQuestions,
      flashcards: matchedFlashcards
    });
  }

  // CONCEPTS: List all or filter by domain
  if (pathname === '/api/concepts' && method === 'GET') {
    const db = loadDatabase();
    const domain = parsedUrl.query.domain;
    let list = db.concepts || [];
    if (domain) {
      list = list.filter(c => c.domain.toLowerCase() === domain.toLowerCase());
    }
    return sendJSON(res, 200, { count: list.length, concepts: list });
  }

  // CONCEPTS: Get single concept
  if (pathname.startsWith('/api/concepts/') && method === 'GET') {
    const id = pathname.replace('/api/concepts/', '');
    const db = loadDatabase();
    const concept = (db.concepts || []).find(c => c.id === id);
    if (!concept) {
      return sendJSON(res, 404, { success: false, message: 'Concept not found.' });
    }
    return sendJSON(res, 200, concept);
  }

  // QUESTIONS: List all or filter
  if (pathname === '/api/questions' && method === 'GET') {
    const db = loadDatabase();
    const domain = parsedUrl.query.domain;
    let list = db.questions || [];
    if (domain && domain !== 'All Topics') {
      list = list.filter(q => q.domain.toLowerCase() === domain.toLowerCase());
    }
    return sendJSON(res, 200, { count: list.length, questions: list });
  }

  // ATTEMPTS: Record new quiz attempt
  if (pathname === '/api/attempts' && method === 'POST') {
    const attemptData = await parseRequestBody(req);
    const db = loadDatabase();

    const newAttempt = {
      id: 'att_' + Date.now(),
      userId: attemptData.userId || 'usr_001',
      domain: attemptData.domain || 'All Topics',
      score: attemptData.score || 0,
      total: attemptData.total || 0,
      percentage: Math.round(((attemptData.score || 0) / (attemptData.total || 1)) * 100),
      timestamp: new Date().toISOString()
    };

    if (!db.attempts) db.attempts = [];
    db.attempts.push(newAttempt);
    saveDatabase(db);

    return sendJSON(res, 201, { success: true, attempt: newAttempt });
  }

  // ATTEMPTS: Retrieve attempts history
  if (pathname === '/api/attempts' && method === 'GET') {
    const db = loadDatabase();
    const userId = parsedUrl.query.userId;
    let list = db.attempts || [];
    if (userId) {
      list = list.filter(a => a.userId === userId);
    }
    return sendJSON(res, 200, { count: list.length, attempts: list });
  }

  // FLASHCARDS: List all
  if (pathname === '/api/flashcards' && method === 'GET') {
    const db = loadDatabase();
    return sendJSON(res, 200, { count: (db.flashcards || []).length, flashcards: db.flashcards || [] });
  }

  // ANALYTICS / STATS: Computed dashboard metrics
  if (pathname === '/api/stats' && method === 'GET') {
    const db = loadDatabase();
    const attempts = db.attempts || [];
    const flashcards = db.flashcards || [];
    
    const totalAttempts = attempts.length;
    const avgScore = totalAttempts > 0 
      ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts) 
      : 0;
    
    // Readiness formula based on exam coverage and average score
    const readiness = Math.min(100, Math.round(avgScore * 0.7 + (Math.min(totalAttempts, 10) * 3)));
    const masteredFlashcards = flashcards.filter(f => (f.box || 1) >= 3).length;

    return sendJSON(res, 200, {
      totalAttempts,
      avgScore,
      readiness,
      masteredFlashcards,
      totalFlashcards: flashcards.length,
      totalConcepts: (db.concepts || []).length,
      totalQuestions: (db.questions || []).length
    });
  }

  // QUOTES: List all quotes or get daily quote
  if (pathname === '/api/quotes' && method === 'GET') {
    const db = loadDatabase();
    return sendJSON(res, 200, { count: (db.quotes || []).length, quotes: db.quotes || [] });
  }

  if (pathname === '/api/quote/daily' && method === 'GET') {
    const db = loadDatabase();
    const quotes = db.quotes || [];
    if (quotes.length === 0) {
      return sendJSON(res, 200, {
        quote: "It always seems impossible until it's done.",
        author: "Nelson Mandela",
        role: "Nobel Laureate",
        tag: "Perseverance"
      });
    }
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const dailyQuote = quotes[dayOfYear % quotes.length];
    return sendJSON(res, 200, dailyQuote);
  }

  // ==========================================
  // STATIC ASSET SERVING
  // ==========================================
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Friendly route aliases
  if (pathname === '/signin' || pathname === '/login') {
    filePath = path.join(__dirname, 'signin.html');
  }

  // Check if target file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Return 404 for missing static asset
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      return res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found - AuraCloud</title></head>
        <body style="font-family:sans-serif; text-align:center; padding:50px; background:#0f172a; color:#f8fafc;">
          <h1 style="color:#a855f7;">404 - Resource Not Found</h1>
          <p>The requested route <code>${pathname}</code> was not found on this server.</p>
          <a href="/" style="display:inline-block; margin-top:20px; padding:10px 20px; background:#6366f1; color:white; text-decoration:none; border-radius:8px;">Back to Study Hub</a>
        </body>
        </html>
      `);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
}

// Create HTTP server
const server = http.createServer(handleRequest);

// Export handler for Vercel Serverless Function & testing
module.exports = handleRequest;
module.exports.server = server;

// Start the server if executed directly via `node server.js`
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` AuraCloud AZ-900 Study Suite Server Online!        `);
    console.log(` Port:    http://localhost:${PORT}                  `);
    console.log(` Sign-in: http://localhost:${PORT}/signin.html      `);
    console.log(` API:     http://localhost:${PORT}/api/health       `);
    console.log(` Database: ${DB_FILE}                              `);
    console.log(`====================================================`);
  });
}

