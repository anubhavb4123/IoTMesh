# TODO: Implement Phone Number Authentication with OTP at Signup

## Completed Tasks
- [x] Analyze current auth setup
- [x] Create implementation plan
- [x] Get user confirmation

## Pending Tasks
- [ ] Update src/lib/firebase.ts to include Firebase Auth exports
- [ ] Update src/contexts/AuthContext.tsx to use phone instead of name
- [ ] Update src/pages/Auth.tsx for phone signup with OTP, then passwords, and login with phone + password
- [ ] Update src/components/ProtectedRoute.tsx if needed (likely no change)
- [ ] Update src/pages/Users.tsx to display phone instead of name, change DB path to "users"
- [ ] Change DB structure to users/{phone}: {role, createdAt}
- [ ] Test signup flow with OTP
- [ ] Test login flow with phone + password
- [ ] Verify role-based access
