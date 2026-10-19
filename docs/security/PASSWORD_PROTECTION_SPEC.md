# 🔑 Password-Protected Short Links Specification
*Authored by Krishna Sijwali (@krish222334843)*

## 1. Flow Architecture
```
[User Clicks Link: /secret-doc]
              │
              ├──► Check Password Gate: (password_hash IS NOT NULL)
              │
              ├──► Render Interstitial Passcode Entry Screen
              │
              ├──► Verify bcrypt Hash (POST /:code/verify)
              │         │
              │         ├──► Success ➔ Issue 15-min JWT Session Cookie ➔ 302 Redirect
              │         └──► Failure ➔ Increment Failed Attempts ➔ Throttle on 5th try
```

## 2. Key Security Properties
- **Zero Plaintext Storage**: Links never store cleartext passwords.
- **Constant Time Verification**: Uses `bcrypt.compare` to defend against timing attacks.
- **Short-Lived Access Tokens**: Authenticated sessions automatically expire to prevent session hijacking.
