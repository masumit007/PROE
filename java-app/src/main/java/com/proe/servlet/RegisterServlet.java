
package com.proe.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proe.database.DBConnection;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.mindrot.jbcrypt.BCrypt;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.regex.Pattern;

@WebServlet("/api/auth/register")
public class RegisterServlet extends HttpServlet {

    private final ObjectMapper mapper = new ObjectMapper();

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    @Override
    protected void doPost(HttpServletRequest request,
                          HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            JsonNode body = mapper.readTree(request.getInputStream());

            if (body == null
                    || !body.isObject()
                    || !body.path("fullName").isTextual()
                    || !body.path("email").isTextual()
                    || !body.path("password").isTextual()) {
                sendError(response, 400,
                        "Name, email and password are required.");
                return;
            }

            String name = body.path("fullName").asText().trim();
            String email = body.path("email").asText()
                    .trim().toLowerCase(java.util.Locale.ROOT);
            String password = body.path("password").asText();

            if (name.length() < 2 || name.length() > 100) {
                sendError(response, 400,
                        "Name must be between 2 and 100 characters.");
                return;
            }

            if (email.length() > 150
                    || !EMAIL_PATTERN.matcher(email).matches()) {
                sendError(response, 400,
                        "Enter a valid email address.");
                return;
            }

            if (password.length() < 8
                    || password.length() > 72) {
                sendError(response, 400,
                        "Password must be between 8 and 72 characters.");
                return;
            }

            String passwordHash = BCrypt.hashpw(
                    password, BCrypt.gensalt(12));

            String sql = "INSERT INTO users "
                    + "(name, email, password_hash) VALUES (?, ?, ?)";

            try (Connection connection = DBConnection.getConnection();
                 PreparedStatement statement =
                         connection.prepareStatement(sql)) {

                statement.setString(1, name);
                statement.setString(2, email);
                statement.setString(3, passwordHash);
                statement.executeUpdate();

                response.setStatus(
                        HttpServletResponse.SC_CREATED);
                mapper.writeValue(response.getWriter(),
                        java.util.Map.of(
                                "message",
                                "Account created successfully."));
            }

        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            sendError(response, 400, "Invalid JSON request.");
        } catch (SQLException e) {
            if ("23000".equals(e.getSQLState())) {
                sendError(response, 409,
                        "This email may already be registered.");
            } else {
                getServletContext().log("Registration failed.", e);
                sendError(response, 500,
                        "Unable to create your account. Please try again.");
            }
        }
    }

    private void sendError(HttpServletResponse response,
                           int status, String message)
            throws IOException {
        response.setStatus(status);
        mapper.writeValue(response.getWriter(),
                java.util.Map.of("message", message));
    }
}
