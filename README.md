# TooHak Backend

## Introduction
This project implements the backend system for **TooHak**, providing core services such as user management, authentication, and API endpoints for application features. The backend is designed with scalability and modularity in mind, following clean architecture principles and ensuring maintainability.

---

## Features
- **User Authentication**: Secure login and registration with session handling or JWT.
- **API Endpoints**: RESTful APIs to support frontend integration.
- **Database Integration**: Persistent storage for users, sessions, and app data.
- **Error Handling**: Clear exception structures and response codes.
- **Scalable Design**: Modular services that can be extended with new features.

---

## Project Structure

├── APIError.ts # Error handling
├── auth.ts # Authentication logic
├── config.json # Configurations
├── dataStore.ts # Data persistence
├── echo.js # Example endpoint
├── echo.test.js # Test for echo
├── helperFunctions.ts # Utility functions
├── newecho.ts # Updated echo implementation
├── newecho.test.ts # Test for updated echo
├── other.ts # Miscellaneous utilities
├── player.ts # Player logic
├── quiz.ts # Quiz logic
├── results_*.csv # Example result data
├── returnInterface.ts # Return type definitions
├── server.ts # Server entry point
├── token.ts # Token/session management
└── wrapper.ts # Wrappers for modules

---

## Roadmap
- Add role-based access control
- Integrate with external APIs
- Deploy to cloud environment with Docker and CI/CD

---

## License
This project was created as part of a university assignment and is intended for educational purposes.
