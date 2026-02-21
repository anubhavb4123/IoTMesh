# Auth System Refactor - TODO

## Progress Tracking

### 1️⃣ Database Structure Update
- [x] Update `src/lib/firebase.ts`
  - [x] Update PATHS.USERS to point to "users" (not "home/users")
  - [x] Add password hashing utilities (already exists - verify)
  - [x] Remove `userStore.addLogin()` function that stores role
  - [x] Add user profile interface without role field


### 2️⃣ AuthContext Update
- [x] Update `src/contexts/AuthContext.tsx`
  - [x] Remove role from localStorage persistence
  - [x] Keep only `uid` and `email` in localStorage
  - [x] Add `login()` function that accepts role dynamically
  - [x] Add Firebase Auth state listener
  - [x] Update `signOut()` to clear Firebase Auth session


### 3️⃣ Registration Flow (Auth.tsx)
- [x] Update `src/pages/Auth.tsx`
  - [x] Add "signup" step for new user registration
  - [x] Implement Firebase Auth `createUserWithEmailAndPassword()`
  - [x] Add IoTMesh password creation step
  - [x] Add Admin password creation step
  - [x] Hash both passwords using SHA-256
  - [x] Save to database: `users/{uid}` with hashed passwords (NO role)
  - [x] Add "Profile not created. Please register first." error message

### 4️⃣ Login Flow (Auth.tsx)
- [x] Update `src/pages/Auth.tsx`
  - [x] Implement Firebase Auth `signInWithEmailAndPassword()`
  - [x] Fetch user profile from `users/{uid}`
  - [x] If no record exists → reject login with error message
  - [x] Prompt for IoTMesh password
  - [x] Verify IoTMesh password against stored hash
  - [x] Show "Login as Guest" / "Login as Admin" options
  - [x] If Admin selected → prompt for Admin password → verify hash
  - [x] Set role in AuthContext only (NOT in localStorage or Firebase)


### 5️⃣ Users Page Update
- [x] Update `src/pages/Users.tsx`
  - [x] Change from reading `home/users` to reading `users/` path
  - [x] Remove role display from users table
  - [x] Show only: email, createdAt timestamp
  - [x] Update delete function path

### 6️⃣ Testing & Verification
- [x] Test registration flow
- [x] Test login flow with IoTMesh password
- [x] Test admin login with admin password
- [x] Test guest login
- [x] Verify role is not stored in localStorage
- [x] Verify role is not stored in Firebase
- [x] Verify ProtectedRoute still works correctly


## Implementation Order
1. firebase.ts (database structure)
2. AuthContext.tsx (state management)
3. Auth.tsx (registration & login flow)
4. Users.tsx (users list display)
