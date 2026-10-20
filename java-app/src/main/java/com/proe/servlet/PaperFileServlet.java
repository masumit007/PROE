
package com.proe.servlet;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@WebServlet("/api/papers/files/*")
public class PaperFileServlet extends HttpServlet {

    private static final Path UPLOAD_DIR =
            Paths.get("D:\\PROE\\uploads").toAbsolutePath().normalize();

    @Override
    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response)
            throws IOException {

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED,
                    "Please log in to access this paper.");
            return;
        }

        String pathInfo = request.getPathInfo();

        if (pathInfo == null || !pathInfo.matches(
                "/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\\.pdf")) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST,
                    "Invalid paper filename.");
            return;
        }

        String filename = pathInfo.substring(1);
        Path file = UPLOAD_DIR.resolve(filename).normalize();

        if (!file.startsWith(UPLOAD_DIR) || !Files.isRegularFile(file)) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND,
                    "Paper not found.");
            return;
        }

        response.setContentType("application/pdf");
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Content-Disposition",
                "inline; filename=\"paper.pdf\"");
        response.setContentLengthLong(Files.size(file));

        Files.copy(file, response.getOutputStream());
    }
}
