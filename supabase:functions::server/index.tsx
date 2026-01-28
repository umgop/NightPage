import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17.4.0";

const app = new Hono();

// Initialize Stripe only if key is available (lazy initialization)
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
let stripe: Stripe | null = null;

if (stripeSecretKey) {
  try {
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });
    console.log('Stripe initialized successfully');
  } catch (err) {
    console.error('Failed to initialize Stripe:', err);
  }
} else {
  console.warn('STRIPE_SECRET_KEY not set - payment features will be unavailable');
}

// Initialize Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Initialize Supabase client with anon key for regular operations
const supabaseAnon = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Simple in-memory rate limiter for auth endpoints
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired one
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false; // Rate limited
  }

  entry.count++;
  return true;
}

// Rate limiting middleware for auth endpoints (5 attempts per minute)
async function rateLimitAuthMiddleware(c: any, next: any) {
  const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
  const endpoint = c.req.path;
  const key = `${ip}:${endpoint}`;

  if (!checkRateLimit(key, 5, 60000)) { // 5 attempts per 60 seconds
    console.warn(`[RATE_LIMIT] Blocked ${ip} on ${endpoint}`);
    return c.json({ error: 'Too many attempts. Please try again later.' }, 429);
  }

  await next();
}

// Enable CORS for all routes and methods
// Allow localhost for development and production domain
const allowedOrigins = [
  'https://nightpage.space',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];
const origin = Deno.env.get('ORIGIN');
const corsOrigins = origin ? [origin] : allowedOrigins;

app.use(
  "/*",
  cors({
    origin: corsOrigins,
    allowHeaders: ["Content-Type", "Authorization", "apikey", "x-client-info", "x-user-token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// Basic server-side sanitizer to remove dangerous tags/attributes before persisting.
function sanitizeHtml(input: string) {
  if (!input) return input;
  // Remove script, iframe, object, embed tags
  let out = input.replace(/<\s*(script|iframe|object|embed)[\s\S]*?>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  // Remove event handler attributes like onclick
  out = out.replace(/on[a-z]+\s*=\s*"[^"]*"/gi, '');
  out = out.replace(/on[a-z]+\s*=\s*'[^']*'/gi, '');
  // Remove javascript: URIs
  out = out.replace(/href\s*=\s*"javascript:[^"']*"/gi, '');
  out = out.replace(/src\s*=\s*"javascript:[^"']*"/gi, '');
  // Strip iframe/object/embed tags left over
  out = out.replace(/<iframe[\s\S]*?>/gi, '');
  out = out.replace(/<object[\s\S]*?>/gi, '');
  out = out.replace(/<embed[\s\S]*?>/gi, '');
  return out;
}

// Middleware to verify authenticated user
async function verifyUser(authHeader: string | null) {
  console.log('[verifyUser] Starting verification...');
  console.log('[verifyUser] Auth header:', authHeader ? `Bearer ${authHeader.substring(0, 20)}...` : 'null');
  
  if (!authHeader) {
    console.error('[verifyUser] ERROR: No authorization header provided');
    throw new Error('No authorization header');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.error('[verifyUser] ERROR: No token in authorization header');
    throw new Error('No token provided');
  }

  console.log('[verifyUser] Token extracted, length:', token.length);

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error) {
    console.error('[verifyUser] ERROR from getUser:', error.message);
    throw new Error('Invalid or expired token');
  }
  
  if (!user) {
    console.error('[verifyUser] ERROR: No user returned');
    throw new Error('Invalid or expired token');
  }

  console.log('[verifyUser] SUCCESS: User verified:', user.id);
  return user;
}

// Auth endpoints
app.post('/auth/signup', rateLimitAuthMiddleware, async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    // Create user with email verification required
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Email verification is required - user must verify before full access
      email_confirm: false
    });

    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Do NOT auto sign-in - user must verify email first
    return c.json({
      success: true,
      message: 'Account created! Please verify your email to continue.',
      userId: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata.name,
      emailVerified: false
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return c.json({ error: err.message || 'Signup failed' }, 500);
  }
});

app.post('/auth/login', rateLimitAuthMiddleware, async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      console.error('Login error:', error);
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    return c.json({
      userId: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || 'User',
      accessToken: data.session.access_token,
      emailVerified: !!data.user.email_confirmed_at
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return c.json({ error: err.message || 'Login failed' }, 500);
  }
});

// Journal entries endpoints
app.post('/journal/save', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyUser(authHeader);

    const { entry } = await c.req.json();
    
    if (!entry || !entry.date || !entry.content) {
      return c.json({ error: 'Invalid entry data' }, 400);
    }

    // Save entry with user ID as part of the key
    const entryKey = `journal:${user.id}:${entry.date}`;
    // Sanitize content server-side as an extra layer of defense
    const sanitized = { ...entry, content: sanitizeHtml(String(entry.content)) };
    await kv.set(entryKey, sanitized);

    return c.json({ success: true, entryId: entry.date });
  } catch (err: any) {
    console.error('Save journal error:', err);
    return c.json({ error: err.message || 'Failed to save entry' }, 500);
  }
});

// Update journal entry (for renaming)
app.put('/journal/entry/:date', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyUser(authHeader);

    const date = c.req.param('date');
    const { title } = await c.req.json();
    
    const entryKey = `journal:${user.id}:${date}`;
    const existingEntry = await kv.get(entryKey);
    
    if (!existingEntry) {
      return c.json({ error: 'Entry not found' }, 404);
    }

    // Update entry with new title
    const updatedEntry = { ...existingEntry, title };
    // Sanitize stored content just in case
    if (updatedEntry.content) updatedEntry.content = sanitizeHtml(String(updatedEntry.content));
    await kv.set(entryKey, updatedEntry);

    return c.json({ success: true, entry: updatedEntry });
  } catch (err: any) {
    console.error('Update journal entry error:', err);
    return c.json({ error: err.message || 'Failed to update entry' }, 500);
  }
});

app.get('/journal/entries', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyUser(authHeader);

    // Get all entries for this user
    const prefix = `journal:${user.id}:`;
    const entries = await kv.getByPrefix(prefix);
    // Ensure returned content is sanitized
    const safe = (entries || []).map((e: any) => ({ ...e, content: sanitizeHtml(String(e?.content || '')) }));

    return c.json({ entries: safe || [] });
  } catch (err: any) {
    console.error('Get journal entries error:', err);
    return c.json({ error: err.message || 'Failed to fetch entries' }, 500);
  }
});

app.delete('/journal/entry/:date', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyUser(authHeader);

    const date = c.req.param('date');
    const entryKey = `journal:${user.id}:${date}`;
    
    await kv.del(entryKey);

    return c.json({ success: true });
  } catch (err: any) {
    console.error('Delete journal entry error:', err);
    return c.json({ error: err.message || 'Failed to delete entry' }, 500);
  }
});

// Admin endpoints - master access
app.get('/admin/users', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyUser(authHeader);

    // 🔒 OPTIONAL: Restrict admin access to specific email
    // Enforce admin email if set in env
    const MASTER_ADMIN_EMAIL = Deno.env.get('MASTER_ADMIN_EMAIL');
    if (MASTER_ADMIN_EMAIL && user.email !== MASTER_ADMIN_EMAIL) {
      return c.json({ error: 'Admin access denied. Contact administrator.' }, 403);
    }

    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      throw error;
    }

    return c.json({ 
      users: users.users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name,
        createdAt: u.created_at
      }))
    });
  } catch (err: any) {
    console.error('Admin get users error:', err);
    return c.json({ error: err.message || 'Failed to fetch users' }, 500);
  }
});

app.get('/admin/user/:userId/entries', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const user = await verifyUser(authHeader);

    // 🔒 OPTIONAL: Restrict admin access to specific email
    // Uncomment and replace with your master admin email for production:
    // const MASTER_ADMIN_EMAIL = 'your-master-admin@email.com';
    // if (user.email !== MASTER_ADMIN_EMAIL) {
    //   return c.json({ error: 'Admin access denied. Contact administrator.' }, 403);
    // }

    const userId = c.req.param('userId');
    const prefix = `journal:${userId}:`;
    const entries = await kv.getByPrefix(prefix);

    return c.json({ entries: entries || [] });
  } catch (err: any) {
    console.error('Admin get user entries error:', err);
    return c.json({ error: err.message || 'Failed to fetch user entries' }, 500);
  }
});

// Health check endpoint
app.get("/make-server-3e97d870/health", (c) => {
  return c.json({ status: "ok" });
});

// AI Journal Assistant endpoint with daily rate limiting (3 prompts per day)
app.post('/ai/prompt', async (c) => {
  try {
    console.log('=== AI PROMPT ENDPOINT CALLED ===');
    
    // Read user token from custom header instead of Authorization
    const userToken = c.req.header('x-user-token');
    console.log('User token present:', !!userToken);
    
    // Verify the user with the custom token header
    const user = await verifyUser(userToken ? `Bearer ${userToken}` : null);
    console.log('User verified:', user.id);

    // Check rate limit (3 prompts per day)
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const rateLimitKey = `ai_prompts:${user.id}:${today}`;
    
    let promptCount = await kv.get(rateLimitKey) || { count: 0 };
    if (typeof promptCount === 'object' && 'count' in promptCount) {
      promptCount = promptCount.count;
    }

    console.log('Prompts used today:', promptCount);

    if (promptCount >= 3) {
      console.warn(`[RATE_LIMIT] User ${user.id} has exceeded 3 prompts for today`);
      return c.json({ error: 'Daily prompt limit reached. Come back tomorrow!' }, 429);
    }

    const { currentContent } = await c.req.json();
    console.log('Current content length:', currentContent?.length || 0);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API key present:', !!openaiApiKey);
    console.log('OpenAI API key length:', openaiApiKey?.length || 0);
    console.log('OpenAI API key starts with:', openaiApiKey?.substring(0, 10));
    
    if (!openaiApiKey) {
      console.error('ERROR: OPENAI_API_KEY not found in environment');
      return c.json({ error: 'AI service not configured' }, 503);
    }

    console.log('Making request to OpenAI...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using gpt-4o-mini for better accessibility and cost-efficiency
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate journaling assistant. Provide thoughtful, deep prompts to help someone reflect on their day, emotions, and personal growth. Keep prompts concise (1-2 sentences) and encouraging.'
          },
          {
            role: 'user',
            content: currentContent 
              ? `Based on what I've written so far: "${currentContent.substring(0, 200)}..." - suggest a follow-up question or reflection prompt to help me go deeper.`
              : 'Give me a thoughtful journal prompt for evening reflection.'
          }
        ],
        max_tokens: 100,
        temperature: 0.8
      })
    });

    console.log('OpenAI response status:', openaiResponse.status);
    console.log('OpenAI response headers:', Object.fromEntries(openaiResponse.headers.entries()));

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error response:', errorText);
      
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
        console.error('OpenAI error parsed:', JSON.stringify(errorJson, null, 2));
      } catch {
        console.error('Could not parse OpenAI error as JSON');
      }
      
      // Return more detailed error
      return c.json({ 
        error: 'OpenAI API error', 
        details: errorJson || errorText,
        status: openaiResponse.status 
      }, 500);
    }

    const data = await openaiResponse.json();
    console.log('OpenAI response data:', JSON.stringify(data, null, 2));
    
    const prompt = data.choices[0].message.content.trim();
    console.log('Generated prompt:', prompt);

    // Increment prompt count for today
    const rateLimitKey = `ai_prompts:${user.id}:${today}`;
    await kv.set(rateLimitKey, { count: promptCount + 1 });
    console.log('Updated prompt count for user:', promptCount + 1);

    return c.json({ prompt });
  } catch (err: any) {
    console.error('AI prompt generation error:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    return c.json({ 
      error: err.message || 'Failed to generate prompt',
      details: err.toString()
    }, 500);
  }
});

// Stripe Payment Endpoints

// Create Stripe checkout session for $5 one-time payment
app.post('/payment/create-checkout', async (c) => {
  try {
    const { email, userId } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    if (!stripe) {
      console.error('Stripe not initialized');
      return c.json({ error: 'Payment service not configured' }, 503);
    }

    // Get the app URL from environment or use default
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'NightPage Pro - Lifetime Access',
              description: 'Pay once. No subscriptions. No noise. Lifetime access to all features.',
            },
            unit_amount: 500, // $5.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}?payment=cancelled`,
      customer_email: email,
      metadata: {
        userId: userId || '',
        email: email,
      },
    });

    console.log('Stripe checkout session created:', session.id);
    return c.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('Create checkout session error:', err);
    return c.json({ error: err.message || 'Failed to create checkout session' }, 500);
  }
});

// Verify payment status
app.post('/payment/verify', async (c) => {
  try {
    const { sessionId } = await c.req.json();
    
    if (!sessionId) {
      return c.json({ error: 'Session ID is required' }, 400);
    }

    if (!stripe) {
      console.error('Stripe not initialized');
      return c.json({ error: 'Payment service not configured' }, 503);
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      const email = session.customer_email || session.metadata?.email;
      const userId = session.metadata?.userId;

      // If userId is provided, update user metadata
      if (userId) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            isPro: true,
            paymentDate: new Date().toISOString(),
            stripeSessionId: sessionId,
          }
        });
        console.log(`User ${userId} upgraded to Pro`);
      }

      return c.json({ 
        success: true, 
        isPro: true,
        email: email,
        userId: userId 
      });
    }

    return c.json({ success: false, isPro: false });
  } catch (err: any) {
    console.error('Verify payment error:', err);
    return c.json({ error: err.message || 'Failed to verify payment' }, 500);
  }
});

// Check user's pro status
app.get('/payment/status', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    // Allow checking without auth for trial users
    if (!authHeader) {
      return c.json({ isPro: false });
    }

    const user = await verifyUser(authHeader);
    const isPro = user.user_metadata?.isPro === true;

    return c.json({ 
      isPro,
      paymentDate: user.user_metadata?.paymentDate || null
    });
  } catch (err: any) {
    // If verification fails, assume free trial
    return c.json({ isPro: false });
  }
});

Deno.serve(app.fetch);