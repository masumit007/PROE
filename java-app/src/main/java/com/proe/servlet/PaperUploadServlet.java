
package com.proe.servlet;

import com.proe.database.DBConnection;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.proe.config.UploadConfig;

@WebServlet("/api/papers/upload")
@MultipartConfig(
    fileSizeThreshold = 1024 * 1024,
    maxFileSize = 10 * 1024 * 1024,
    maxRequestSize = 12 * 1024 * 1024
)
public class PaperUploadServlet extends HttpServlet {

    private static final Path UPLOAD_DIR = UploadConfig.UPLOAD_DIR;

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doPost(HttpServletRequest request,
                          HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            sendJson(response, 401,
                    Map.of("message", "Please log in to submit a paper."));
            return;
        }

        int authorId = (Integer) session.getAttribute("userId");
        Path savedFile = null;

        try {
            request.setCharacterEncoding("UTF-8");

            String title = getField(request, "title");
            String abstractText = getField(request, "abstract");
            String keywords = getField(request, "keywords");
            Part pdf = request.getPart("pdf");

            if (title.isBlank() || abstractText.isBlank()
                    || keywords.isBlank() || pdf == null
                    || pdf.getSize() == 0) {
                sendJson(response, 400,
                        Map.of("message",
                                "Title, abstract, keywords and PDF are required."));
                return;
            }

            if (title.length() > 255 || keywords.length() > 255) {
                sendJson(response, 400,
                        Map.of("message",
                                "Title or keywords exceed the allowed length."));
                return;
            }

            if (pdf.getSize() > 10 * 1024 * 1024) {
                sendJson(response, 400,
                        Map.of("message", "PDF must be 10 MB or smaller."));
                return;
            }

            String originalName = Paths.get(
                    pdf.getSubmittedFileName() == null
                            ? "" : pdf.getSubmittedFileName()
            ).getFileName().toString();

            if (!originalName.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
                sendJson(response, 400,
                        Map.of("message", "Only PDF files are accepted."));
                return;
            }

            // Check the actual file signature, not only its extension.
            byte[] signature = new byte[5];

            try (InputStream input = pdf.getInputStream()) {
                if (input.read(signature) != 5
                        || signature[0] != '%'
                        || signature[1] != 'P'
                        || signature[2] != 'D'
                        || signature[3] != 'F'
                        || signature[4] != '-') {
                    sendJson(response, 400,
                            Map.of("message", "The uploaded file is not a valid PDF."));
                    return;
                }
            }

            Files.createDirectories(UPLOAD_DIR);

            String storedName = UUID.randomUUID() + ".pdf";
            savedFile = UPLOAD_DIR.resolve(storedName).normalize();

            if (!savedFile.startsWith(UPLOAD_DIR)) {
                sendJson(response, 400,
                        Map.of("message", "Invalid upload path."));
                return;
            }

            try (InputStream input = pdf.getInputStream()) {
                Files.copy(input, savedFile,
                        StandardCopyOption.REPLACE_EXISTING);
            }

            // The URL is an identifier for now. A separate download
            // endpoint will securely serve files outside the web root.
            String paperUrl = "/proe/api/papers/files/" + storedName;

            String sql = "INSERT INTO papers "
                    + "(author_id, title, abstract, keywords, paper_url) "
                    + "VALUES (?, ?, ?, ?, ?)";

            try (Connection connection = DBConnection.getConnection();
                 PreparedStatement statement =
                         connection.prepareStatement(
                                 sql, PreparedStatement.RETURN_GENERATED_KEYS)) {

                statement.setInt(1, authorId);
                statement.setString(2, title);
                statement.setString(3, abstractText);
                statement.setString(4, keywords);
                statement.setString(5, paperUrl);

                int inserted = statement.executeUpdate();

                if (inserted != 1) {
                    throw new SQLException("Paper was not inserted.");
                }

                try (ResultSet keys = statement.getGeneratedKeys()) {
                    if (!keys.next()) {
                        throw new SQLException("No paper ID was generated.");
                    }

                    int paperId = keys.getInt(1);

                    response.setStatus(HttpServletResponse.SC_CREATED);
                    sendJson(response, 201, Map.of(
                            "message", "Paper submitted successfully.",
                            "paperId", paperId,
                            "paperUrl", paperUrl
                    ));
                }
            }

        } catch (IllegalStateException e) {
            sendJson(response, 413,
                    Map.of("message", "Upload exceeds the allowed size."));
        } catch (ServletException e) {
            getServletContext().log("PDF upload request failed.", e);
            sendJson(response, 400,
                    Map.of("message", "Unable to process the uploaded PDF."));
        } catch (IOException | SQLException e) {
            getServletContext().log("Paper upload failed.", e);

            if (savedFile != null) {
                try {
                    Files.deleteIfExists(savedFile);
                } catch (IOException cleanupError) {
                    getServletContext().log(
                            "Could not remove an incomplete upload.",
                            cleanupError);
                }
            }

            if (!response.isCommitted()) {
                sendJson(response, 500,
                        Map.of("message", "Unable to submit the paper."));
            }
        }
    }

    private String getField(HttpServletRequest request, String name)
            throws IOException, ServletException {
        Part part = request.getPart(name);

        if (part == null) {
            return "";
        }

        try (InputStream input = part.getInputStream()) {
            return new String(input.readAllBytes(),
                    java.nio.charset.StandardCharsets.UTF_8).trim();
        }
    }

    private void sendJson(HttpServletResponse response,
                          int status, Map<String, ?> body)
            throws IOException {
        response.setStatus(status);
        mapper.writeValue(response.getWriter(), body);
    }
}
