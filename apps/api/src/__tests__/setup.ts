// Variables de entorno para tests — se cargan antes de cualquier import
process.env["NODE_ENV"] = "test";
process.env["PORT"] = "8080";
process.env["DATABASE_URL"] = "postgresql://test:test@localhost:5432/test";
process.env["JWT_ACCESS_SECRET"] = "test_access_secret_must_be_at_least_32_chars_long";
process.env["JWT_REFRESH_SECRET"] = "test_refresh_secret_must_be_at_least_32_chars_long";
process.env["JWT_ACCESS_EXPIRES_IN"] = "15m";
process.env["JWT_REFRESH_EXPIRES_IN"] = "7d";
process.env["CLIENT_URL"] = "http://localhost:5173";
