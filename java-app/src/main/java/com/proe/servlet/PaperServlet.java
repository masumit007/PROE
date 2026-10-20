
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
import java.util.Map;

@WebServlet("/api/papers")
public class PaperServlet extends HttpServlet {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doPost(HttpServletRequest request,
                          HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        // Only logged-in users may submit papers.
        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            sendJson(response, 401,
                    Map.of("message", "Please log in to submit a paper."));
            return;
        }

        int authorId = (Integer) session.getAttribute("userId");

        try {
            JsonNode body = mapper.readTree(request.getInputStream());

            if (body == null || !body.isObject()
                    || !body.path("title").isTextual()
                    || !body.path("abstract").isTextual()
                    || !body.path("keywords").isTextual()
                    || !body.path("paperUrl").isTextual()) {
                sendJson(response, 400,
                        Map.of("message", "All paper fields are required."));
                return;
            }

            String title = body.path("title").asText().trim();
            String paperAbstract = body.path("abstract").asText().trim();
            String keywords = body.path("keywords").asText().trim();
            String paperUrl = body.path("paperUrl").asText().trim();

            if (title.isEmpty() || paperAbstract.isEmpty()
                    || keywords.isEmpty() || paperUrl.isEmpty()) {
                sendJson(response, 400,
                        Map.of("message", "All paper fields are required."));
                return;
            }

            if (title.length() > 255 || keywords.length() > 255
                    || paperUrl.length() > 500) {
                sendJson(response, 400,
                        Map.of("message", "One or more fields exceed the allowed length."));
                return;
            }

            String sql = "INSERT INTO papers "
                    + "(author_id, title, abstract, keywords, paper_url) "
                    + "VALUES (?, ?, ?, ?, ?)";

            try (Connection connection = DBConnection.getConnection();
                 PreparedStatement statement =
                         connection.prepareStatement(sql,
                                 PreparedStatement.RETURN_GENERATED_KEYS)) {

                statement.setInt(1, authorId);
                statement.setString(2, title);
                statement.setString(3, paperAbstract);
                statement.setString(4, keywords);
                statement.setString(5, paperUrl);

                statement.executeUpdate();

                try (var keys = statement.getGeneratedKeys()) {
                    if (keys.next()) {
                        int paperId = keys.getInt(1);

                        sendJson(response, 201,
                                Map.of(
                                        "message", "Paper submitted successfully.",
                                        "paperId", paperId
                                ));
                    } else {
                        sendJson(response, 500,
                                Map.of("message", "Paper was saved, but its ID could not be retrieved."));
                    }
                }
            }

        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            sendJson(response, 400, Map.of("message", "Invalid JSON request."));
        } catch (SQLException e) {
            getServletContext().log("Paper submission failed.", e);
            sendJson(response, 500,
                    Map.of("message", "Unable to submit paper. Please try again."));
        }
    }


@Override
protected void doGet(HttpServletRequest request,
                     HttpServletResponse response)
        throws IOException {

    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");

    String paperIdParam = request.getParameter("paperId");

    boolean singlePaper = paperIdParam != null;

    String sql;

    if (singlePaper) {
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

        sql = "SELECT paper_id, author_id, title, abstract, keywords, "
                + "paper_url, created_at FROM papers WHERE paper_id = ?";
    } else {
        sql = "SELECT paper_id, author_id, title, abstract, keywords, "
                + "paper_url, created_at FROM papers ORDER BY created_at DESC";
    }

    try (Connection connection = DBConnection.getConnection();
         PreparedStatement statement = connection.prepareStatement(sql)) {

        if (singlePaper) {
            statement.setInt(1, Integer.parseInt(paperIdParam));
        }

        try (var result = statement.executeQuery()) {
            var papers = new java.util.ArrayList<Map<String, Object>>();

            while (result.next()) {
                Map<String, Object> paper = new java.util.LinkedHashMap<>();

                paper.put("paperId", result.getInt("paper_id"));
                paper.put("authorId", result.getInt("author_id"));
                paper.put("title", result.getString("title"));
                paper.put("abstract", result.getString("abstract"));
                paper.put("keywords", result.getString("keywords"));
                paper.put("paperUrl", result.getString("paper_url"));
                paper.put("createdAt",
                        result.getTimestamp("created_at").toString());

                papers.add(paper);
            }

            if (singlePaper && papers.isEmpty()) {
                sendJson(response, 404,
                        Map.of("message", "Paper not found."));
                return;
            }

            response.setStatus(HttpServletResponse.SC_OK);

            if (singlePaper) {
                mapper.writeValue(response.getWriter(), papers.get(0));
            } else {
                mapper.writeValue(response.getWriter(), papers);
            }
        }

    } catch (SQLException e) {
        getServletContext().log("Paper retrieval failed.", e);
        sendJson(response, 500,
                Map.of("message", "Unable to retrieve papers."));
    }
}



    private void sendJson(HttpServletResponse response, int status,
                          Map<String, ?> data) throws IOException {
        response.setStatus(status);
        mapper.writeValue(response.getWriter(), data);
    }
}
