package com.proe.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proe.database.DBConnection;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Locale;
import java.util.Map;

@WebServlet("/api/reviews")
public class ReviewServlet extends HttpServlet {

    private final ObjectMapper mapper = new ObjectMapper();


@Override
protected void doGet(HttpServletRequest request,
                     HttpServletResponse response)
        throws IOException {

    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");

    String paperIdParam = request.getParameter("paperId");

    if (paperIdParam == null || paperIdParam.isBlank()) {
        sendJson(response, 400,
                Map.of("message", "paperId is required."));
        return;
    }

    int paperId;

    try {
        paperId = Integer.parseInt(paperIdParam);
        if (paperId <= 0) {
            throw new NumberFormatException();
        }
    } catch (NumberFormatException e) {
        sendJson(response, 400,
                Map.of("message", "paperId must be a positive integer."));
        return;
    }

    String sql = "SELECT review_id, paper_id, reviewer_id, rating, "
            + "comments, recommendation, created_at "
            + "FROM reviews WHERE paper_id = ? "
            + "ORDER BY created_at DESC";

    try (Connection connection = DBConnection.getConnection();
         PreparedStatement statement = connection.prepareStatement(sql)) {

        statement.setInt(1, paperId);

        try (var result = statement.executeQuery()) {
            var reviews = new java.util.ArrayList<Map<String, Object>>();

            while (result.next()) {
                Map<String, Object> review = new java.util.LinkedHashMap<>();

                review.put("reviewId", result.getInt("review_id"));
                review.put("paperId", result.getInt("paper_id"));
                review.put("reviewerId", result.getInt("reviewer_id"));
                review.put("rating", result.getInt("rating"));
                review.put("comments", result.getString("comments"));
                review.put("recommendation",
                        result.getString("recommendation"));
                review.put("createdAt",
                        result.getTimestamp("created_at").toString());

                reviews.add(review);
            }

            response.setStatus(HttpServletResponse.SC_OK);
            mapper.writeValue(response.getWriter(), reviews);
        }

    } catch (SQLException e) {
        getServletContext().log("Review retrieval failed.", e);
        sendJson(response, 500,
                Map.of("message", "Unable to retrieve reviews."));
    }
}
    @Override
    protected void doPost(HttpServletRequest request,
                          HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        // Only logged-in users can submit reviews.
        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            sendJson(response, 401,
                    Map.of("message", "Please log in to submit a review."));
            return;
        }

        int reviewerId = (Integer) session.getAttribute("userId");

        try {
            JsonNode body = mapper.readTree(request.getInputStream());

            if (body == null || !body.isObject()
                    || !body.path("paperId").canConvertToInt()
                    || !body.path("rating").canConvertToInt()
                    || !body.path("comments").isTextual()
                    || !body.path("recommendation").isTextual()) {
                sendJson(response, 400,
                        Map.of("message", "Paper ID, rating, comments, and recommendation are required."));
                return;
            }

            int paperId = body.path("paperId").asInt();
            int rating = body.path("rating").asInt();
            String comments = body.path("comments").asText().trim();
            String recommendation = body.path("recommendation")
                    .asText().trim().toUpperCase(Locale.ROOT);

            if (paperId <= 0 || rating < 1 || rating > 5
                    || comments.isEmpty()
                    || !recommendation.equals("ACCEPT")
                    && !recommendation.equals("REVISE")
                    && !recommendation.equals("REJECT")) {
                sendJson(response, 400,
                        Map.of("message", "Invalid paper ID, rating, comments, or recommendation."));
                return;
            }

            String sql = "INSERT INTO reviews "
                    + "(paper_id, reviewer_id, rating, comments, recommendation) "
                    + "VALUES (?, ?, ?, ?, ?)";

            try (Connection connection = DBConnection.getConnection();
                 PreparedStatement statement =
                         connection.prepareStatement(sql,
                                 PreparedStatement.RETURN_GENERATED_KEYS)) {

                statement.setInt(1, paperId);
                statement.setInt(2, reviewerId);
                statement.setInt(3, rating);
                statement.setString(4, comments);
                statement.setString(5, recommendation);

                statement.executeUpdate();

                try (var keys = statement.getGeneratedKeys()) {
                    if (keys.next()) {
                        sendJson(response, 201,
                                Map.of(
                                        "message", "Review submitted successfully.",
                                        "reviewId", keys.getInt(1)
                                ));
                    } else {
                        sendJson(response, 500,
                                Map.of("message", "Review saved, but its ID could not be retrieved."));
                    }
                }
            }

        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            sendJson(response, 400,
                    Map.of("message", "Invalid JSON request."));
        } catch (SQLException e) {
            // SQLState 23 indicates an integrity constraint violation,
            // such as a missing paper or a duplicate review.
            if (e.getSQLState() != null
                    && e.getSQLState().startsWith("23")) {
                sendJson(response, 409,
                        Map.of("message", "The paper may not exist, or you may have already reviewed it."));
            } else {
                getServletContext().log("Review submission failed.", e);
                sendJson(response, 500,
                        Map.of("message", "Unable to submit review."));
            }
        }
    }

    private void sendJson(HttpServletResponse response, int status,
                          Map<String, ?> data) throws IOException {
        response.setStatus(status);
        mapper.writeValue(response.getWriter(), data);
    }
}
