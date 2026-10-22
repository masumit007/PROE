
package com.proe.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proe.database.DBConnection;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.mindrot.jbcrypt.BCrypt;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Locale;
import java.util.Map;

@WebServlet("/api/auth/login")
public class LoginServlet extends HttpServlet {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doPost(HttpServletRequest request,
                          HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            JsonNode body = mapper.readTree(request.getInputStream());

            if (body == null || !body.isObject()
                    || !body.path("email").isTextual()
                    || !body.path("password").isTextual()) {
                sendError(response, 400,
                        "Email and password are required.");
                return;
            }

            String email = body.path("email").asText()
                    .trim().toLowerCase(Locale.ROOT);
            String password = body.path("password").asText();

            if (email.isBlank() || password.isEmpty()) {
                sendError(response, 400,
                        "Email and password are required.");
                return;
            }

            String sql = "SELECT user_id, name, password_hash "
                    + "FROM users WHERE email = ?";

            try (Connection connection = DBConnection.getConnection();
                 PreparedStatement statement =
                         connection.prepareStatement(sql)) {

                statement.setString(1, email);

                try (ResultSet result = statement.executeQuery()) {

                    if (!result.next()
                            || !BCrypt.checkpw(
                                    password,
                                    result.getString("password_hash"))) {
                        sendError(response, 401,
                                "Invalid email or password.");
                        return;
                    }

                    int userId = result.getInt("user_id");
                    String name = result.getString("name");

                    // Prevent session fixation after authentication.
                    HttpSession oldSession = request.getSession(false);
                    if (oldSession != null) {
                        oldSession.invalidate();
                    }

                    HttpSession session = request.getSession(true);
                    session.setAttribute("userId", userId);
                    session.setAttribute("userName", name);
                    session.setMaxInactiveInterval(30 * 60);

                    response.setStatus(HttpServletResponse.SC_OK);
                    mapper.writeValue(response.getWriter(),
                            Map.of(
                                    "message", "Login successful.",
                                    "userId", userId,
                                    "name", name
                            ));
                }
            }

        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            sendError(response, 400, "Invalid JSON request.");
        } catch (SQLException e) {
            getServletContext().log("Login failed.", e);
            sendError(response, 500,
                    "Unable to log in. Please try again.");
        } catch (IllegalArgumentException e) {
            // BCrypt.checkpw throws this when the stored hash is not a valid
            // bcrypt hash (for example an account created by another service).
            getServletContext().log(
                    "Login rejected: stored password hash is not bcrypt.", e);
            sendError(response, 401, "Invalid email or password.");
        }
    }

    private void sendError(HttpServletResponse response,
                           int status, String message)
            throws IOException {
        response.setStatus(status);
        mapper.writeValue(response.getWriter(),
                Map.of("message", message));
    }
}