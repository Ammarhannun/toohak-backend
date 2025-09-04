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
```
src/
├── controllers/        # API controllers handling requests
├── services/           # Business logic
├── models/             # Data models and entities
├── repositories/       # Database access layer
├── exceptions/         # Custom exception handling
├── utils/              # Helper classes
└── Application.java    # Entry point
```

---

## Getting Started

### Clone the repository
```bash
git clone https://github.com/USERNAME/toohak-backend.git
cd toohak-backend
```

### Build and Run
If using Gradle:
```bash
./gradlew build
./gradlew bootRun
```

If using Maven:
```bash
mvn clean install
mvn spring-boot:run
```

The application will run on:
```
http://localhost:8080
```

---

## API Documentation
API endpoints are exposed under `/api/`. Example:
- `POST /api/auth/register` – Register new user
- `POST /api/auth/login` – User login
- `GET /api/users` – Fetch users

(OpenAPI/Swagger integration recommended if available.)

---

## Testing
Run all tests with:
```bash
./gradlew test
```
or
```bash
mvn test
```

---

## Roadmap
- Add role-based access control
- Integrate with external APIs
- Deploy to cloud environment with Docker and CI/CD

---

## License
This project was created as part of a university assignment and is intended for educational purposes.
