# Nexoresha Technologies Backend (Intern Management System) Spec

## 1. Project Overview
The Nexoresha Technologies Backend is a robust, Node.js-based REST API designed for managing intern registrations and approval workflows. It implements a secure portal for prospective interns to register by uploading critical identity documents (College ID and Aadhaar Card) and tracking their application status. System administrators (Admins) can review, filter, approve, or reject these applications, and maintain database audit trails of who made each decision and when.

---

## 2. Key Objectives
* **Secure Document Submissions**: Enable applicants to upload physical proofs safely using standardized formats.
* **Granular Role-based Access**: Separate access pathways so interns can register and track their applications, while admins can manage the approval pipeline.
* **Token Invalidation Security**: Ensure logouts are immediately enforced across all devices using Token Versioning.
* **Detailed Audit History**: Track which administrator approved/rejected an application and log detailed rejection explanations.

---

## 3. Database Architecture (Models)
The system leverages MongoDB with Mongoose to manage two distinct collections: **Admins** and **Interns**.

```
  +--------------+                     +------------------+
  |    Admin     |                     |      Intern      |
  +--------------+                     +------------------+
  | _id          | <------------------ | approvedBy       | (Ref: Admin)
  | name         |                     | name             |
  | email        |                     | email            |
  | password     |                     | password         |
  | tokenVersion |                     | tokenVersion     |
  | createdAt    |                     | phone            |
  | updatedAt    |                     | aadhaarNumber    |
  +--------------+                     | collegeName      |
                                       | yearOfStudy      |
                                       | status           | (pending/approved/rejected)
                                       | documents        | (collegeIdCard, aadhaarCard)
                                       | rejectionReason  |
                                       | approvedAt       |
                                       | rejectedAt       |
                                       | createdAt        |
                                       | updatedAt        |
                                       +------------------+
```

### 3.1 Admins Model
* **File Path**: [admin.model.js](file:///c:/Projects/Nexoresha%20Tech%20Backend/models/admin.model.js)
* **Schema Definition**:
  ```javascript
  {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true, minlength: 6 },
      tokenVersion: { type: Number, default: 0 }
  }
  ```
* **Why it was created & How it is used**:
  * **Purpose**: Represents the authorized administrative users of the Nexoresha platform.
  * **Password Protection**: Hashed using `bcryptjs` (salt rounds: 10) in a pre-save hook. Includes a comparison helper function `comparePassword`.
  * **Token Versioning**: Stores a `tokenVersion` number. When the admin logs out, this version is incremented. The authentication middleware verifies that the token payload's version matches the database version, enabling instant session invalidation without stateful session tracking.

### 3.2 Interns Model
* **File Path**: [intern.model.js](file:///c:/Projects/Nexoresha%20Tech%20Backend/models/intern.model.js)
* **Schema Definition**:
  ```javascript
  {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true, minlength: 6 },
      tokenVersion: { type: Number, default: 0 },
      phone: { type: String, required: true, trim: true },
      aadhaarNumber: { type: String, required: true, trim: true },
      collegeName: { type: String, required: true, trim: true },
      yearOfStudy: { type: Number, required: true },
      documents: {
          collegeIdCard: { type: String, required: true }, // File path to local uploads
          aadhaarCard: { type: String, required: true }    // File path to local uploads
      },
      status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      rejectionReason: { type: String, default: "" },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
      approvedAt: { type: Date, default: null },
      rejectedAt: { type: Date, default: null }
  }
  ```
* **Why it was created & How it is used**:
  * **Purpose**: Manages all intern applicants, storing contact details, academic info, identification numbers, and upload links.
  * **State Tracking**: The `status` property controls access. Only approved interns proceed, and rejected profiles display `rejectionReason` fields.
  * **Security & Document Paths**: Hashing is active for passwords. Document URLs point to local files uploaded via Multer, enabling path verification when reviewing files.
  * **Audit Trails**: Stores references to the `Admin` who verified the applicant (`approvedBy`), and timestamps to track application turnaround times.

---

## 4. Middlewares
The application intercepts incoming REST requests using three key middleware modules:

### 4.1 Admin Authentication Middleware
* **File Path**: [adminAuth.middleware.js](file:///c:/Projects/Nexoresha%20Tech%20Backend/middlewares/adminAuth.middleware.js)
* **Logic**:
  1. Extracts the Bearer token from the `Authorization` header.
  2. Verifies the token using `JWT_SECRET`.
  3. Queries the `Admin` collection to find the user.
  4. Compares `decoded.tokenVersion` with the Admin's `tokenVersion` in the DB. If they mismatch, rejects the request.
  5. Binds the verified admin instance to `req.admin` and calls `next()`.

### 4.2 Intern Authentication Middleware
* **File Path**: [internAuth.middleware.js](file:///c:/Projects/Nexoresha%20Tech%20Backend/middlewares/internAuth.middleware.js)
* **Logic**:
  1. Extracts the Bearer token from the `Authorization` header.
  2. Verifies the token using `JWT_SECRET`.
  3. Queries the `Intern` collection to find the user.
  4. Compares the token version to detect logouts.
  5. Binds the verified intern instance to `req.intern` and calls `next()`.

### 4.3 Upload Middleware (Multer)
* **File Path**: [upload.middleware.js](file:///c:/Projects/Nexoresha%20Tech%20Backend/middlewares/upload.middleware.js)
* **Logic**:
  1. Configures disk storage in the root folder `/uploads/`.
  2. Cleans up filenames by replacing white-spaces with hyphens (`-`) and prefixing a millisecond timestamp to prevent overwriting.
  3. Applies filters restricting uploads to image files (`image/*`) and PDF documents (`application/pdf`).
  4. Sets file size limits to **5MB** to protect the host machine from storage exhaustion.

---

## 5. API Specification & Triggering Parameters

Below is a detailed matrix of all routes. We list exactly what parameters (URL route parameters, body keys, and file fields) trigger the controller logic, and how those parameters are processed.

### 5.1 Route Summary Table

| HTTP Method | Route Endpoint | Controller Function | Access Control | Primary Inputs |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/admin/login` | `loginAdmin` | Public | `email`, `password` (body) |
| **POST** | `/api/admin/logout` | `logoutAdmin` | Admin JWT | Token Header |
| **GET** | `/api/admin/interns` | `getAllInterns` | Admin JWT | None |
| **GET** | `/api/admin/interns/pending` | `getPendingInterns` | Admin JWT | None |
| **GET** | `/api/admin/interns/approved` | `getApprovedInterns` | Admin JWT | None |
| **GET** | `/api/admin/interns/rejected` | `getRejectedInterns` | Admin JWT | None |
| **GET** | `/api/admin/interns/:id` | `getInternById` | Admin JWT | `:id` (route param) |
| **PATCH** | `/api/admin/interns/:id/approve` | `approveIntern` | Admin JWT | `:id` (route param) |
| **PATCH** | `/api/admin/interns/:id/reject` | `rejectIntern` | Admin JWT | `:id` (route param), `reason` (body) |
| **DELETE** | `/api/admin/interns/delete/:id` | `deleteIntern` | Admin JWT | `:id` (route param) |
| **POST** | `/api/intern/register` | `registerIntern` | Public | `name`, `email`, `password`, `phone`, `aadhaarNumber`, `collegeName`, `yearOfStudy` (body), `collegeIdCard`, `aadhaarCard` (files) |
| **POST** | `/api/intern/login` | `loginIntern` | Public | `email`, `password` (body) |
| **GET** | `/api/intern/status` | `getInternStatus` | Intern JWT | Token Header |

---

### 5.2 Admin Controller Endpoints
Defined in: [admin.controller.js](file:///c:/Projects/Nexoresha%20Tech%20Backend/controllers/admin.controller.js)

#### 1. POST `/api/admin/login`
* **Trigger Input Parameters**:
  * `req.body.email` (String, Required): The admin email.
  * `req.body.password` (String, Required): The plaintext admin password.
* **Function Block**: `loginAdmin`
* **Internal Behavior**:
  1. Checks if email and password are provided.
  2. Searches the `Admin` database by email.
  3. Invokes the `.comparePassword()` method.
  4. If correct, generates a JWT token incorporating `tokenVersion` and returns the token and user details.
* **Response Output**:
  * **Success (200 OK)**: `{ "success": true, "message": "Login successful", "data": { "admin": { "id", "name", "email" }, "token" } }`
  * **Failure (400 / 401)**: `{ "success": false, "message": "Invalid email or password" }`

#### 2. POST `/api/admin/logout`
* **Trigger Input Parameters**:
  * Bearer Token in `Authorization` Header.
* **Function Block**: `logoutAdmin`
* **Internal Behavior**:
  1. The token is verified, loading `req.admin`.
  2. Increments the `tokenVersion` of the authenticated admin in MongoDB.
  3. Saves the document to invalidate all issued JWTs.
* **Response Output**:
  * **Success (200 OK)**: `{ "success": true, "message": "Logout successful" }`

#### 3. GET `/api/admin/interns`
* **Trigger Input Parameters**:
  * Bearer Token in `Authorization` Header.
* **Function Block**: `getAllInterns`
* **Internal Behavior**:
  1. Queries all documents from the `Intern` collection.
  2. Sorts them latest-first: `.sort({ createdAt: -1 })`.
* **Response Output**:
  * **Success (200 OK)**: `{ "success": true, "message": "Interns retrieved successfully", "data": [...] }`

#### 4. GET `/api/admin/interns/pending`
* **Trigger Input Parameters**:
  * Bearer Token in `Authorization` Header.
* **Function Block**: `getPendingInterns`
* **Internal Behavior**:
  1. Queries the database using the filter `{ status: "pending" }`.
  2. Sorts by creation date.
* **Response Output**:
  * **Success (200 OK)**: `{ "success": true, "data": [ ... pending interns ] }`

#### 5. GET `/api/admin/interns/approved`
* **Trigger Input Parameters**:
  * Bearer Token in `Authorization` Header.
* **Function Block**: `getApprovedInterns`
* **Internal Behavior**:
  1. Queries the database with filter `{ status: "approved" }`.
* **Response Output**:
  * **Success (200 OK)**: `{ "success": true, "data": [ ... approved interns ] }`

#### 6. GET `/api/admin/interns/rejected`
* **Trigger Input Parameters**:
  * Bearer Token in `Authorization` Header.
* **Function Block**: `getRejectedInterns`
* **Internal Behavior**:
  1. Queries the database with filter `{ status: "rejected" }`.
* **Response Output**:
  * **Success (200 OK)**: `{ "success": true, "data": [ ... rejected interns ] }`

#### 7. GET `/api/admin/interns/:id`
* **Trigger Input Parameters**:
  * `req.params.id` (String, Route Parameter, Required): The 24-character hexadecimal MongoDB ObjectId of the intern.
* **Function Block**: `getInternById`
* **Internal Behavior**:
  1. Validates that the `:id` route parameter is a valid ObjectId.
  2. Fetches the intern profile.
  3. Populates the `approvedBy` relational reference with only the admin's `name` and `email`.
* **Response Output**:
  * **Success (200 OK)**: `{ "success": true, "data": { ... intern data } }`
  * **Failure (400 Invalid ID / 404 Not Found)**: `{ "success": false, "message": "Intern not found" }`

#### 8. PATCH `/api/admin/interns/:id/approve`
* **Trigger Input Parameters**:
  * `req.params.id` (String, Route Parameter, Required): The intern ID.
* **Function Block**: `approveIntern`
* **Internal Behavior**:
  1. Validates the `:id` parameter format.
  2. Finds the intern document.
  3. Mutates the status and audit properties:
     * Sets `status` to `"approved"`.
     * Sets `approvedAt` to `new Date()`.
     * Links `approvedBy` to `req.admin._id`.
     * Clears out existing `rejectionReason` and `rejectedAt` properties.
  4. Saves the updated profile.
* **Response Output**:
  * **Success (200 OK)**: `{ "success": true, "message": "Intern approved successfully", "data": { ... } }`

#### 9. PATCH `/api/admin/interns/:id/reject`
* **Trigger Input Parameters**:
  * `req.params.id` (String, Route Parameter, Required): The intern ID.
  * `req.body.reason` (String, Body, Optional): The text explaining why the application is being rejected.
* **Function Block**: `rejectIntern`
* **Internal Behavior**:
  1. Validates the `:id` parameter format.
  2. Pulls the optional `reason` text from the body payload.
  3. Modifies the intern document properties:
     * Sets `status` to `"rejected"`.
     * Sets `rejectionReason` to the provided `reason` (or empty string).
     * Sets `rejectedAt` to `new Date()`.
     * Resets `approvedAt` and `approvedBy` fields back to `null`.
  4. Saves the updated profile.
* **Response Output**:
  * **Success (200 OK)**: `{ "success": true, "message": "Intern rejected successfully", "data": { ... } }`

#### 10. DELETE `/api/admin/interns/delete/:id`
* **Trigger Input Parameters**:
  * `req.params.id` (String, Route Parameter, Required): The intern ID.
* **Function Block**: `deleteIntern`
* **Internal Behavior**:
  1. Checks for valid ObjectId format.
  2. Runs `findByIdAndDelete` on the Intern collection.
* **Response Output**:
  * **Success (200 OK)**: `{ "success": true, "message": "Intern deleted successfully" }`

---

### 5.3 Intern Controller Endpoints
Defined in: [intern.controller.js](file:///c:/Projects/Nexoresha Tech Backend/controllers/intern.controller.js)

#### 1. POST `/api/intern/register`
* **Trigger Input Parameters**:
  * **Request Body Fields**:
    * `req.body.name` (String, Required): Legal full name.
    * `req.body.email` (String, Required): Active email.
    * `req.body.password` (String, Required): Plaintext password (min 6 characters).
    * `req.body.phone` (String, Required): Phone contact number.
    * `req.body.aadhaarNumber` (String, Required): 12-digit Aadhaar Card code.
    * `req.body.collegeName` (String, Required): Enrolled academic institution.
    * `req.body.yearOfStudy` (Number, Required): Current study year (e.g. 1, 2, 3).
  * **Uploaded Files** (Processed by Multer):
    * `req.files.collegeIdCard[0]` (File, Required): PDF/image file of College ID.
    * `req.files.aadhaarCard[0]` (File, Required): PDF/image file of Aadhaar Card.
* **Function Block**: `registerIntern`
* **Internal Behavior**:
  1. Confirms the presence of all text properties in `req.body`.
  2. Ensures both document files are present in `req.files`.
  3. Checks if any database record shares the same `email`, `phone`, or `aadhaarNumber` to prevent duplicates.
  4. Creates standard storage strings pointing to the local static uploads, e.g. `/uploads/1719324567890-file.pdf`.
  5. Saves the record, setting `status` to its default of `"pending"`.
* **Response Output**:
  * **Success (201 Created)**: `{ "success": true, "message": "Registration submitted successfully. Waiting for admin approval.", "data": { "internId" } }`
  * **Failure (400 Bad Request)**: `{ "success": false, "message": "Intern with this email, phone, or aadhaar already exists." }`

#### 2. POST `/api/intern/login`
* **Trigger Input Parameters**:
  * `req.body.email` (String, Required): Intern email.
  * `req.body.password` (String, Required): Plaintext password.
* **Function Block**: `loginIntern`
* **Internal Behavior**:
  1. Checks for input fields.
  2. Queries the `Intern` schema for the matching email.
  3. Compares passwords using the schema method `.comparePassword()`.
  4. Generates a signed JWT token containing the intern ID, email, and their current `tokenVersion`.
* **Response Output**:
  * **Success (200 OK)**: `{ "success": true, "message": "Login successful", "data": { "intern": { "id", "name", "email", "status" }, "token" } }`
  * **Failure (401 Unauthorized)**: `{ "success": false, "message": "Invalid email or password" }`

#### 3. GET `/api/intern/status`
* **Trigger Input Parameters**:
  * Bearer Token in `Authorization` Header.
* **Function Block**: `getInternStatus`
* **Internal Behavior**:
  1. Receives the validated payload from `internAuth` middleware.
  2. Queries the database using `req.intern._id`.
  3. Selects only status fields: `.select("status rejectionReason name email")`.
* **Response Output**:
  * **Success (200 OK)**: `{ "success": true, "data": { "name", "email", "status", "rejectionReason" } }`

---

## 6. Security Flow
```
User Login Request
   │
   ▼
[Check Credentials] ──(Invalid)──> [Return 401 Unauthorized]
   │
   ▼ (Valid)
[Generate JWT Token] (Includes: User ID, Email, tokenVersion)
   │
   ▼
Authenticated API Requests (Headers: Authorization: Bearer <JWT>)
   │
   ▼
[Authentication Middleware] 
   │
   ├── (Verify JWT Signature) ────(Expired/Invalid)──> [Return 401 Unauthorized]
   │
   ▼ (Valid Token)
[Fetch User from DB & Compare tokenVersion]
   │
   ├── (Mismatch - Logged out) ──────────────────────> [Return 401 Unauthorized]
   │
   ▼ (Match)
[Attach User to Request] ──> [Forward to Controller Handler] 
```

---

## 7. Conclusion
The Nexoresha Tech Backend provides a clean, well-architected framework for managing intern registrations. By separating endpoints into dedicated `admin` and `intern` route files, enforcing token validation through standalone middlewares, handling document uploads securely with file filtering, and persisting detailed administrative records, the codebase is easily maintainable and production-ready.
