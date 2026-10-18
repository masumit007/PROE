
package com.proe.servlet;

import java.io.IOException;
import java.sql.Connection;
import java.sql.SQLException;

import com.proe.database.DBConnection;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/api/db-health")
public class DatabaseTestServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response) throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try (Connection connection = DBConnection.getConnection()) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write(
                "{\"status\":\"UP\",\"database\":\"connected\"}"
            );
        } catch (SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write(
                "{\"status\":\"DOWN\",\"database\":\"connection_failed\"}"
            );
            getServletContext().log("Database connection failed", e);
        }
    }
}