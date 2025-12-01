# Pair Programming Task - part 2: Advanced User Authentication Server

## Overview

In this lab, we'll build a more comprehensive user registration and login system that collects additional user information including **age** and **phone number**.

We'll use MongoDB for data storage, bcrypt for password security, and Postman for testing. This lab emphasizes **data validation**, **handling multiple fields**, and **managing database constraints**.

**Estimated Time:** 1 hours  
**Difficulty Level:** Beginner to Intermediate  
**Technologies:** Node.js, Express, MongoDB, bcrypt, Postman

**Key Differences from Lab 1:**
- ✓ Collect more user data (age, phone number)
- ✓ Validate numeric and phone data
- ✓ Handle multiple unique constraints (email AND phone number)
- ✓ More complex form validation

---

## Table of Contents
1. [Project Setup](#project-setup)
2. [Understanding the Enhanced Architecture](#understanding-the-enhanced-architecture)
3. [User Data Validation](#user-data-validation)
4. [How bcrypt Works (Quick Review)](#how-bcrypt-works-quick-review)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Testing with Postman](#testing-with-postman)
7. [Challenge: Extending the User Model](#challenge-extending-the-user-model)
8. [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Project Setup

### Prerequisites
- **Node.js** installed 
- **MongoDB** running locally or a MongoDB Atlas account (cloud)
- **Postman** installed for API testing
- **npm** (comes with Node.js)

### File Structure
```
project/
├── index.js                 # Entry point - Express app setup
├── config/
│   └── db.js               # Database connection
├── models/
│   └── userModel.js        # User schema (with age & phoneNumber)
├── controllers/
│   └── userController.js   # Business logic for signup/login
├── routes/
│   └── userRouter.js       # API routes
├── middleware/
│   └── requireAuth.js      # Optional: protect routes
├── package.json            # Dependencies
├── .env                    # Environment variables (DO NOT COMMIT)
└── .env.example            # Example of .env file
```

---

## Understanding the Enhanced Architecture

### How the Request Flows (Enhanced)

```
User submits form with: email, password, age, phoneNumber
       ↓
Express Server (index.js) receives request
       ↓
Route Handler (userRouter.js) matches URL pattern
       ↓
Controller Function (userController.js) executes logic
       ├─ Validates all 4 fields
       ├─ Checks email format
       ├─ Checks password strength
       ├─ Validates age (numeric, reasonable range)
       ├─ Validates phone number format
       └─ Checks for duplicate email AND phone number
       ↓
Model (userModel.js) interacts with MongoDB
       ↓
Response sent back to Postman with user data
```

### The Extended Routes

| Route | Method | Purpose | Input |
|-------|--------|---------|-------|
| `/api/user/signup` | POST | Register a new user | `{ email, password, age, phoneNumber }` |
| `/api/user/login` | POST | Log in existing user | `{ email, password }` |

**Notice:** Login still only requires email and password (not age/phone).

---

## User Data Validation

### What We're Validating

When a user signs up, we need to validate **4 pieces of information**:

| Field | Type | Validation Rules |
|-------|------|------------------|
| `email` | String | Valid email format, unique in database |
| `password` | String | 8+ chars, uppercase, lowercase, number, symbol |
| `age` | Number | Must be a number, reasonable range (18-120) |
| `phoneNumber` | String | Valid format, unique in database |

### Age Validation

```javascript
// Valid ages: 18-120
const age = 25;  // ✓ Valid

// Invalid ages
const age = 15;   // ✗ Too young
const age = 150;  // ✗ Invalid
const age = "25"; // ✗ Not a number
```

### Phone Number Validation

We'll accept phone numbers in these formats:
```
✓ 123-456-7890
✓ 1234567890
✓ (123) 456-7890
✓ +1 123 456 7890
✓ 123.456.7890
```

**Tip:** For simplicity, we'll just check:
1. It's at least 10 characters
2. It contains mostly digits
3. It's unique in database (no two users with same phone)

---

## How bcrypt Works (Quick Review)

### The Security Process

**During Signup:** Plain password → Hash with salt → Store hashed version

**During Login:** User's plain password → Hash with stored salt → Compare hashes

**Key Point:** We NEVER store the plain password. Only the hash!

```javascript
// Example
const password = "4wa95=Vx#!";
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
// Result: "$2b$10$abcdefghijklmnopqrstu.N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3"

// Database stores the hashed version only!
```

For a detailed review, see **part 1: How bcrypt Works** section.

---

## Step-by-Step Implementation

### Step 0: Initialize Project & Install Dependencies

**Step 0.1: Create Project Directory**

Open terminal and run:
```bash
mkdir w7-bepp1-lab2
cd w7-bepp1-lab2
```

**Step 0.2: Initialize npm Repository**

```bash
npm init -y
```

**Step 0.3: Install Dependencies**

```bash
npm install express mongoose dotenv bcryptjs validator cors
```

**Step 0.4: Install Development Dependencies**

```bash
npm install --save-dev nodemon
```

**Step 0.5: Create Folder Structure**

```bash
mkdir config
mkdir models
mkdir controllers
mkdir routes
mkdir middleware
```

Your project structure should now be ready.

---

### Step 1: Setup Environment Variables

Create a `.env` file in your project root:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/w7-bepp1-lab2
SECRET=76573c5c7b43c500325f985c60d544b5d62b543550ee7aa65f41e33bfdbec5f584ef8725818d6f9d26a7a27c773d868dd1b2d76bb9dbfb6b78c28060eb46120
```

**MongoDB Setup:**

**Option A: Local MongoDB**
```env
MONGO_URI=mongodb://localhost:27017/w7-bepp2
```

**Option B: MongoDB Atlas (Cloud)**
```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/w7-bepp2
```

---

### Step 2: Create the Enhanced User Model

**File:** `models/userModel.js`

This is the key difference from Lab 1! We now have **4 fields** instead of 2.

```javascript
const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true  // No duplicate emails!
  },
  password: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true  // No duplicate phone numbers!
  }
})

module.exports = mongoose.model('User', userSchema)
```

**Key Points:**

| Field | Type | Unique | Required | Purpose |
|-------|------|--------|----------|---------|
| `email` | String | ✓ Yes | ✓ Yes | User login identifier |
| `password` | String | No | ✓ Yes | Hashed password |
| `age` | Number | No | ✓ Yes | User's age |
| `phoneNumber` | String | ✓ Yes | ✓ Yes | Contact info, must be unique |

**Why `unique: true` for both email and phoneNumber?**
- Email: Standard practice for login systems
- PhoneNumber: Often used as alternative contact/verification method

**Important:** MongoDB enforces uniqueness at the database level. If you try to create a second user with the same email or phone, MongoDB will throw an error!

---

### Step 3: Setup Database Connection

**File:** `config/db.js`

```javascript
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

### Step 4: Create the Enhanced Controller

**File:** `controllers/userController.js`

This controller handles the **validation of 4 fields** and **signup/login logic**.

```javascript
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const validator = require("validator");

// ============ HELPER FUNCTION: VALIDATE PHONE NUMBER ============
const isValidPhoneNumber = (phoneNumber) => {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Check if at least 10 digits (standard phone number length)
  return digitsOnly.length >= 10;
};

// ============ HELPER FUNCTION: VALIDATE AGE ============
const isValidAge = (age) => {
  // Age must be a number between 18 and 120
  return !isNaN(age) && age >= 18 && age <= 120;
};

// ============ SIGNUP CONTROLLER ============
const signupUser = async (req, res) => {
  // Step 1: Extract all 4 fields from request body
  const { email, password, age, phoneNumber } = req.body;

  try {
    // ===== VALIDATION =====
    
    // Check if all fields are provided
    if (!email || !password || !age || !phoneNumber) {
      throw Error("All fields must be filled (email, password, age, phoneNumber)");
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      throw Error("Email not valid");
    }

    // Validate password strength
    // Must have: 8+ chars, uppercase, lowercase, number, symbol
    if (!validator.isStrongPassword(password)) {
      throw Error("Password not strong enough");
    }

    // Validate age
    if (!isValidAge(age)) {
      throw Error("Age must be a number between 18 and 120");
    }

    // Validate phone number format
    if (!isValidPhoneNumber(phoneNumber)) {
      throw Error("Phone number must have at least 10 digits");
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      throw Error("Email already in use");
    }

    // Check if phone number already exists
    const phoneExists = await User.findOne({ phoneNumber });
    if (phoneExists) {
      throw Error("Phone number already in use");
    }

    // ===== HASH PASSWORD =====
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // ===== CREATE USER =====
    
    // Store user with all 4 fields (password is hashed)
    const user = await User.create({ 
      email, 
      password: hash,
      age,
      phoneNumber
    });

    // Send success response
    res.status(200).json({ user });

  } catch (error) {
    // Send error response
    res.status(400).json({ error: error.message });
  }
};

// ============ LOGIN CONTROLLER ============
const loginUser = async (req, res) => {
  // Step 1: Extract email and password from request body
  // Note: Login ONLY needs email and password, not age or phone
  const { email, password } = req.body;

  try {
    // ===== VALIDATION =====
    
    if (!email || !password) {
      throw Error("All fields must be filled");
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw Error("Incorrect email");
    }

    // ===== COMPARE PASSWORD =====
    
    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      throw Error("Incorrect password");
    }

    // ===== SUCCESS =====
    
    // Send success response with user data
    res.status(200).json({ user });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { signupUser, loginUser };
```

**Key Enhancements:**

1. **Helper Functions:**
   - `isValidPhoneNumber()`: Extracts digits and checks length
   - `isValidAge()`: Validates age is a number between 18-120

2. **New Validations:**
   - All 4 fields must be provided
   - Age must be in valid range
   - Phone number format validation
   - Both email AND phone number uniqueness checks

3. **New Database Checks:**
   ```javascript
   // Check email
   const emailExists = await User.findOne({ email });
   
   // Check phone number  
   const phoneExists = await User.findOne({ phoneNumber });
   ```

---

### Step 5: Create Routes

**File:** `routes/userRouter.js`

```javascript
const express = require('express')
const { loginUser, signupUser } = require('../controllers/userController')

const router = express.Router()

// POST /api/user/signup
// Expects: { email, password, age, phoneNumber }
router.post('/signup', signupUser)

// POST /api/user/login
// Expects: { email, password }
router.post('/login', loginUser)

module.exports = router
```

**Notice:** Routes are the same, but the controller now handles more data!

---

### Step 6: Setup Express Server

**File:** `index.js`

```javascript
require("dotenv").config();

const cors = require("cors");
const express = require("express");
const userRoutes = require("./routes/userRouter");
const connectDB = require("./config/db");

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== DATABASE CONNECTION =====
connectDB();

// ===== ROUTES =====
app.use("/api/user", userRoutes);

// ===== START SERVER =====
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
```

---

## Testing with Postman

### Start Your Server

```bash
npm run dev
```

Expected output:
```
Server is running on http://localhost:4000
MongoDB Connected: localhost
```

---

### Test 1: Signup with All Valid Data

**URL:** `http://localhost:4000/api/user/signup`

**Method:** POST

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "4wa95=Vx#!",
  "age": 28,
  "phoneNumber": "555-123-4567"
}
```

**Expected Response (Success):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "password": "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/DJm",
    "age": 28,
    "phoneNumber": "555-123-4567",
    "__v": 0
  }
}
```

**What We Can See:**
- ✓ All 4 fields are stored
- ✓ Password is hashed (not plain text)
- ✓ Age is stored as a number
- ✓ Phone number is stored as a string

---

### Test 2: Signup with Missing Age Field

**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "4wa95=Vx#!",
  "phoneNumber": "555-987-6543"
}
```

**Expected Error Response:**
```json
{
  "error": "All fields must be filled (email, password, age, phoneNumber)"
}
```

---

### Test 3: Signup with Invalid Age (Too Young)

**Request Body:**
```json
{
  "email": "bob@example.com",
  "password": "4wa95=Vx#!",
  "age": 16,
  "phoneNumber": "555-111-2222"
}
```

**Expected Error Response:**
```json
{
  "error": "Age must be a number between 18 and 120"
}
```

---

### Test 4: Signup with Invalid Age (Too Old)

**Request Body:**
```json
{
  "email": "bob@example.com",
  "password": "4wa95=Vx#!",
  "age": 150,
  "phoneNumber": "555-111-2222"
}
```

**Expected Error Response:**
```json
{
  "error": "Age must be a number between 18 and 120"
}
```

---

### Test 5: Signup with Invalid Age (Not a Number)

**Request Body:**
```json
{
  "email": "bob@example.com",
  "password": "4wa95=Vx#!",
  "age": "twenty-five",
  "phoneNumber": "555-111-2222"
}
```

**Expected Error Response:**
```json
{
  "error": "Age must be a number between 18 and 120"
}
```

---

### Test 6: Signup with Invalid Phone Number (Too Short)

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "4wa95=Vx#!",
  "age": 32,
  "phoneNumber": "123-45"
}
```

**Expected Error Response:**
```json
{
  "error": "Phone number must have at least 10 digits"
}
```

---

### Test 7: Signup with Duplicate Email

**Request Body (same email as Test 1):**
```json
{
  "email": "john@example.com",
  "password": "4wa95=Vx#!",
  "age": 35,
  "phoneNumber": "555-999-8888"
}
```

**Expected Error Response:**
```json
{
  "error": "Email already in use"
}
```

---

### Test 8: Signup with Duplicate Phone Number

**Request Body (same phone as Test 1):**
```json
{
  "email": "newperson@example.com",
  "password": "4wa95=Vx#!",
  "age": 40,
  "phoneNumber": "555-123-4567"
}
```

**Expected Error Response:**
```json
{
  "error": "Phone number already in use"
}
```

---

### Test 9: Login with Correct Credentials

**URL:** `http://localhost:4000/api/user/login`

**Method:** POST

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "4wa95=Vx#!"
}
```

**Expected Response (Success):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "password": "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/DJm",
    "age": 28,
    "phoneNumber": "555-123-4567",
    "__v": 0
  }
}
```

**Notice:**
- Login returns the full user object (including age and phone)
- No need to submit age/phone for login (only email and password)

---

### Test 10: Login with Wrong Password

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "WrongPassword123!"
}
```

**Expected Error Response:**
```json
{
  "error": "Incorrect password"
}
```

---

### Test 11: Valid Phone Number Formats

All of these should work (they all have 10+ digits):

```json
{
  "email": "user1@example.com",
  "password": "4wa95=Vx#!",
  "age": 25,
  "phoneNumber": "555-123-4567"
}
```

```json
{
  "email": "user2@example.com",
  "password": "4wa95=Vx#!",
  "age": 25,
  "phoneNumber": "5551234567"
}
```

```json
{
  "email": "user3@example.com",
  "password": "4wa95=Vx#!",
  "age": 25,
  "phoneNumber": "(555) 123-4567"
}
```

```json
{
  "email": "user4@example.com",
  "password": "4wa95=Vx#!",
  "age": 25,
  "phoneNumber": "+1 555 123 4567"
}
```

All should succeed! ✓

---

## Validation Summary Table

| Test Case | Email | Password | Age | Phone | Expected Result |
|-----------|-------|----------|-----|-------|-----------------|
| All valid | `user@ex.com` | `Pass123!` | 25 | `555-123-4567` | ✓ Success |
| Missing age | `user@ex.com` | `Pass123!` | - | `555-123-4567` | ✗ Error |
| Invalid age (too young) | `user@ex.com` | `Pass123!` | 16 | `555-123-4567` | ✗ Error |
| Invalid age (too old) | `user@ex.com` | `Pass123!` | 150 | `555-123-4567` | ✗ Error |
| Invalid age (not a number) | `user@ex.com` | `Pass123!` | "abc" | `555-123-4567` | ✗ Error |
| Short phone number | `user@ex.com` | `Pass123!` | 25 | `123-45` | ✗ Error |
| Duplicate email | (existing) | `Pass123!` | 25 | `555-999-8888` | ✗ Error |
| Duplicate phone | `new@ex.com` | `Pass123!` | 25 | (existing) | ✗ Error |
| Valid login | `user@ex.com` | `Pass123!` | - | - | ✓ Success |
| Wrong password | `user@ex.com` | `Wrong123!` | - | - | ✗ Error |

---

## Common Issues & Troubleshooting

### Issue 1: "E11000 duplicate key error for email"

**Cause:** Trying to create a second user with same email.

**Solution:** Use a different email address.

### Issue 2: "E11000 duplicate key error for phoneNumber"

**Cause:** Trying to create a second user with same phone number.

**Solution:** Use a different phone number.

### Issue 3: "Age must be a number between 18 and 120"

**Cause:** Age value is invalid.

**Solutions:**
- Make sure age is a NUMBER, not a string: `"age": 25` ✓ not `"age": "25"` ✗
- Check age is between 18 and 120

### Issue 4: "Phone number must have at least 10 digits"

**Cause:** Phone number doesn't have enough digits.

**Solution:** 
- Ensure phone number has at least 10 digits
- Valid format: `555-123-4567` (has 10 digits even with dashes)
- Valid format: `5551234567` (exactly 10 digits)

### Issue 5: "All fields must be filled"

**Cause:** One or more required fields are missing.

**Solution:** Include all 4 fields in signup request:
```json
{
  "email": "...",
  "password": "...",
  "age": ...,
  "phoneNumber": "..."
}
```

### Issue 6: Server won't start - "Cannot find module"

**Solution:**
```bash
npm install
```

---

## Learning Outcomes

By completing this Lab 2, you'll understand:

✓ How to build models with **multiple fields**  
✓ How to validate **different data types** (strings, numbers)  
✓ How to enforce **multiple unique constraints**  
✓ How to create **helper validation functions**  
✓ How to handle **complex error scenarios**  
✓ How MongoDB **uniqueness** works  
✓ How to test **edge cases** in Postman  

---

## Challenge: Extending the User Model

### Your Task

Now that you've mastered validation of multiple fields, let's practice by adding one more field!

**New Requirement:** Add an `address` field to the user model.

```javascript
address: {
  type: String,
  required: true
}
```

### What You Need to Do:

1. **Update the User Model** (`models/userModel.js`)
   - Add the `address` field as shown above
   - Make it required
   - No need for unique constraint

2. **Update the Controller** (`controllers/userController.js`)
   - Extract `address` from request body
   - Add validation to ensure address is provided
   - Add helpful error message if address is missing
   - Store address in database

3. **Test in Postman**
   - Update Test 1 to include address:
     ```json
     {
       "email": "john@example.com",
       "password": "4wa95=Vx#!",
       "age": 28,
       "phoneNumber": "555-123-4567",
       "address": "123 Main St, Anytown, USA"
     }
     ```
   - Verify address is returned in response
   - Test missing address (should return error)

### Hints:

- Address validation is simple: just check if it's not empty
- Add address after phone number in your controller
- Update the error message to include address: `"All fields must be filled (email, password, age, phoneNumber, address)"`

### Solution Checklist:

- [ ] `address` field added to userModel.js
- [ ] `address` extracted from req.body in signupUser
- [ ] Address validation check added (not empty)
- [ ] `address` passed to User.create()
- [ ] Signup test with address passes
- [ ] Signup test without address fails with error

---

## Here's the Updated User Model to Guide You:

```javascript
const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('User', userSchema)
```

---

## Files Summary

| File | Purpose |
|------|---------|
| `index.js` | Express server setup & middleware |
| `config/db.js` | MongoDB connection |
| `models/userModel.js` | User schema (email, password, age, phoneNumber) |
| `controllers/userController.js` | Signup/Login with validation for 4 fields |
| `routes/userRouter.js` | API endpoint definitions |
| `.env` | Secret configuration (DO NOT COMMIT) |
| `package.json` | Project dependencies |

---

## Commands Reference

```bash
# Install dependencies
npm install

# Start server (development with nodemon)
npm run dev

# Start server (production)
npm start
```

---

## Key Differences: Lab 1 vs Lab 2

| Aspect | Lab 1 | Lab 2 |
|--------|-------|-------|
| User Fields | 2 (email, password) | 4 (email, password, age, phoneNumber) |
| Unique Constraints | 1 (email) | 2 (email, phoneNumber) |
| Validations | 3 | 6+ (includes age range, phone format) |
| Complexity | Beginner | Beginner-Intermediate |
| Focus | Basic auth | Data validation, multiple constraints |
| Challenge | Add address field | Extend for real-world use |

---

Happy coding! 🚀

<!-- 
---

## Next Steps (Advanced)

Once you master this lab, explore:

1. **JWT Tokens** - Return a token on login instead of full user object
2. **Update User Profile** - Allow users to update their age/phone
3. **Delete User Account** - Add user deletion endpoint
4. **User Search** - Find users by email or phone
5. **Additional Fields** - Add address, dateOfBirth, profilePicture, etc. 

-->