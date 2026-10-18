
package com.proe.servlet;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.Map;

@WebServlet("/api/auth/me")
public class MeServlet extends HttpServlet {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

            mapper.writeValue(response.getWriter(),
                    Map.of("message", "You are not logged in."));
            return;
        }

        response.setStatus(HttpServletResponse.SC_OK);

        mapper.writeValue(response.getWriter(),
                Map.of(
                        "loggedIn", true,
                        "userId", session.getAttribute("userId"),
                        "name", session.getAttribute("userName")
                ));
    }
}
