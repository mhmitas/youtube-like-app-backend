# Youtube like app Backend
*28 June 2024*

## Approaches

### 👉Registration User:
- **Make a User Model:** 
    1. first identify which data i need then create a user model.
    2. I need to hash password when i will save password to DB, so i need to create a `pre` middleware of mongoose to hash password
    3. Then create 3 methods: a. For Password Verify, b. Generate Access Token, c. Generate Refresh Token 
- **Handle Route Part:** 
    1. create an user router in user.router.js file and export it. In app.js file create an endpoint "/api/v1/users" because when any request hit this api i will give it to the user router and user router will handle all request coming to this endpoint
    2. create an endpoint "/register" in user.routes.js file and a controller name registerUser in user.controller.js file, Because when any request will come to the "/register" endpoint i will call registerUser function from user.controller.js.
    3. Then in user.controller.js file registerUser function will do the job to register user: 
- **Register User:** 
    1. Before Register user i have to think about preparing all data to start the register user operation
    2. Since, here i need 2 images i will do some work for getting all images perfectly: --> create multer middleware (using multer because here i have to handle multipart/form-data) and in this middleware upload 2 image in local folder. --> create a utility function to upload image on cloudinary.
    3. then write registration logic and register the user

### 👉Login User: 
### 👉Logout User: 
### 👉Get Current User: 
### 👉Get Current User: 
### 👉Refresh Access Token: 
### 👉User Update Related APIs: 
