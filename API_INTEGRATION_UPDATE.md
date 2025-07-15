# API-Driven User Information Update

## Summary of Changes

I've updated the `authService.ts` to **always fetch real user information from the API** instead of using hardcoded fallback data.

## Key Changes Made:

### 1. Enhanced `fetchUserProfile` Function

- ✅ Added detailed logging for debugging API calls
- ✅ Improved error handling with specific error types
- ✅ Better error messages for different failure scenarios
- ✅ Network error detection and handling

### 2. Updated Login Flow

- ✅ **Primary**: Always attempts to fetch real user profile from API
- ✅ **Fallback**: If first attempt fails, tries again
- ✅ **Last Resort**: Only uses minimal JWT data if both API calls fail
- ✅ Removed hardcoded user information

### 3. Enhanced Token Validation

- ✅ Always fetches fresh user data from API during token validation
- ✅ Forces re-login if profile fetch fails (ensures data integrity)
- ✅ Removed hardcoded fallback data

### 4. Added Profile Refresh Method

- ✅ New `refreshUserProfile()` method for manual profile updates
- ✅ Can be called from components to refresh user data
- ✅ Automatic token retrieval from storage

## API Integration Details:

### Endpoint Used:

```
GET https://manzone.wizlab.io.vn/users/profile
Headers:
- Authorization: Bearer {token}
- accept: */*
```

### Expected Response Format:

```json
{
  "success": true,
  "message": "Lấy thông tin người dùng thành công",
  "data": {
    "id": 9,
    "firstName": "Admin",
    "lastName": "Manzone",
    "email": "admin@gmail.com",
    "role": "ADMIN",
    "phoneNumber": "0123456789",
    "avatarUrl": "https://i.pinimg.com/736x/cd/4b/d9/cd4bd9b0ea2807611ba3a67c331bff0b.jpg",
    "address": "Admin House",
    "active": true,
    "createdAt": "2025-07-15T12:47:35.650761Z",
    "updatedAt": "2025-07-15T12:47:35.650761Z",
    "deleted": false
  }
}
```

## Benefits:

1. **Real-Time Data**: User information is always fetched from the API
2. **Data Consistency**: No more hardcoded values that can become outdated
3. **Better Debugging**: Detailed logging for API call troubleshooting
4. **Improved Error Handling**: Specific error types for different failure scenarios
5. **Profile Refresh**: Ability to refresh user data without re-login

## Error Handling:

- **401 Unauthorized**: Token is invalid, forces re-login
- **403 Forbidden**: Insufficient permissions
- **Network Errors**: Detected and handled appropriately
- **API Structure Errors**: Invalid response format detection

## Testing:

The application is running on `http://localhost:5174` and will now:

1. Always fetch real user data from your API
2. Display actual user information (Admin Manzone, real avatar, etc.)
3. Handle API failures gracefully
4. Provide detailed logging for debugging

## Console Debugging:

You can monitor the API calls in the browser console:

- Login attempts will show "Fetching user profile from API..."
- Successful fetches will show "User profile fetched successfully: {email}"
- Errors will show detailed error information

This ensures your dashboard always displays the most up-to-date user information directly from your API.
